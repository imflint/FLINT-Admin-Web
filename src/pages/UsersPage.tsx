import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  App as AntApp,
  Alert,
  Avatar,
  Button,
  Card,
  DatePicker,
  Descriptions,
  Drawer,
  Form,
  Input,
  Select,
  Space,
  Table,
  Tag,
  Typography
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { Dayjs } from "dayjs";
import { useState } from "react";

import {
  adminQueryKeys,
  getAdminUser,
  getAdminUsers,
  moderateAdminUser
} from "../shared/api/adminEndpoints";
import {
  userActionLabels,
  userRoleLabels,
  userStatusLabels
} from "../shared/api/adminLabels";
import type {
  AdminUserModerationHistoryRes,
  AdminUserSummaryRes,
  UserModerationAction,
  UserStatus
} from "../shared/api/adminTypes";

type UserStatusFilter = UserStatus | "ALL";
type DirectUserAction = Exclude<UserModerationAction, "KEEP">;

interface UserModerationFormValues {
  action: DirectUserAction;
  expiresAt?: Dayjs;
  adminMemo?: string;
}

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50];
const directUserActionOptions: { label: string; value: DirectUserAction }[] = [
  { label: userActionLabels.WARN, value: "WARN" },
  { label: userActionLabels.RESTRICT_UPLOAD, value: "RESTRICT_UPLOAD" },
  { label: userActionLabels.SUSPEND, value: "SUSPEND" }
];

export function UsersPage() {
  const { message } = AntApp.useApp();
  const queryClient = useQueryClient();
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState<string | undefined>();
  const [status, setStatus] = useState<UserStatusFilter>("ALL");
  const [createdRange, setCreatedRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [form] = Form.useForm<UserModerationFormValues>();
  const selectedAction = Form.useWatch("action", form);
  const listParams = {
    keyword,
    status: status === "ALL" ? undefined : status,
    createdFrom: createdRange?.[0]?.format("YYYY-MM-DD"),
    createdTo: createdRange?.[1]?.format("YYYY-MM-DD"),
    page,
    size: pageSize
  };
  const usersQuery = useQuery({
    queryKey: adminQueryKeys.users(listParams),
    queryFn: () => getAdminUsers(listParams)
  });
  const detailQuery = useQuery({
    queryKey: selectedUserId ? adminQueryKeys.user(selectedUserId) : ["admin", "users", "empty"],
    queryFn: () => getAdminUser(selectedUserId!),
    enabled: selectedUserId !== null
  });
  const moderationMutation = useMutation({
    mutationFn: (values: UserModerationFormValues) =>
      moderateAdminUser(selectedUserId!, {
        action: values.action,
        expiresAt: values.expiresAt ? values.expiresAt.format("YYYY-MM-DDTHH:mm:ss") : null,
        adminMemo: normalizeOptionalText(values.adminMemo) ?? undefined
      }),
    onSuccess: async (user) => {
      void message.success("회원 조치를 저장했습니다.");
      form.resetFields();
      queryClient.setQueryData(adminQueryKeys.user(user.userId), user);
      await queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: () => {
      void message.error("회원 조치를 저장하지 못했습니다.");
    }
  });

  const columns: ColumnsType<AdminUserSummaryRes> = [
    {
      title: "닉네임",
      dataIndex: "nickname",
      key: "nickname",
      render: (nickname: string, user) => (
        <Space>
          <Avatar src={user.profileImageUrl ?? undefined}>{nickname.slice(0, 1)}</Avatar>
          <Typography.Text strong>{nickname}</Typography.Text>
        </Space>
      )
    },
    {
      title: "계정 상태",
      dataIndex: "status",
      key: "status",
      width: 110,
      render: (value: UserStatus) => <Tag color={value === "ACTIVE" ? "green" : "default"}>{userStatusLabels[value]}</Tag>
    },
    {
      title: "회원 유형",
      dataIndex: "userRole",
      key: "userRole",
      width: 120,
      render: (value: keyof typeof userRoleLabels) => userRoleLabels[value]
    },
    {
      title: "경고 횟수",
      dataIndex: "warningCount",
      key: "warningCount",
      width: 100,
      render: (value: number) => `${value}회`
    },
    {
      title: "업로드 제한",
      dataIndex: "uploadRestricted",
      key: "uploadRestricted",
      width: 140,
      render: (value: boolean, user) => renderRestriction(value, user.uploadRestrictedUntil)
    },
    {
      title: "이용 정지",
      dataIndex: "suspended",
      key: "suspended",
      width: 140,
      render: (value: boolean, user) => renderRestriction(value, user.suspendedUntil)
    },
    {
      title: "가입일",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 130,
      render: formatDate
    },
    {
      title: "작업",
      key: "action",
      width: 100,
      render: (_, user) => (
        <Button type="link" onClick={() => setSelectedUserId(user.userId)}>
          상세 보기
        </Button>
      )
    }
  ];
  const selectedUser = detailQuery.data;

  const handleSearch = (value: string) => {
    setKeyword(normalizeOptionalText(value));
    setPage(1);
  };

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <Typography.Title level={1}>회원 관리</Typography.Title>
          <Typography.Paragraph>회원 정보를 확인하고 필요한 조치를 기록합니다.</Typography.Paragraph>
        </div>
      </header>

      <Card
        title="회원 목록"
        extra={
          <Space className="user-filter-bar" wrap>
            <Input.Search
              allowClear
              placeholder="닉네임 또는 회원 ID 검색"
              value={keywordInput}
              onChange={(event) => setKeywordInput(event.target.value)}
              onSearch={handleSearch}
            />
            <Select<UserStatusFilter>
              aria-label="계정 상태"
              value={status}
              className="status-select"
              onChange={(value) => {
                setStatus(value);
                setPage(1);
              }}
              options={[
                { label: "전체", value: "ALL" },
                { label: "정상", value: "ACTIVE" },
                { label: "탈퇴", value: "WITHDRAWN" }
              ]}
            />
            <DatePicker.RangePicker
              value={createdRange}
              format="YYYY-MM-DD"
              onChange={(value) => {
                setCreatedRange(value as [Dayjs, Dayjs] | null);
                setPage(1);
              }}
            />
          </Space>
        }
      >
        {usersQuery.isError ? <Alert type="error" showIcon message="회원 목록을 불러오지 못했습니다." /> : null}
        <Table
          rowKey="userId"
          columns={columns}
          dataSource={usersQuery.data?.data ?? []}
          loading={usersQuery.isPending}
          pagination={{
            current: page,
            pageSize,
            total: usersQuery.data?.meta.totalElements ?? 0,
            showSizeChanger: true,
            pageSizeOptions: PAGE_SIZE_OPTIONS,
            showTotal: (total, range) => `${range[0]}-${range[1]} / 전체 ${total}명`,
            onChange: (nextPage, nextPageSize) => {
              setPage(nextPage);
              setPageSize(nextPageSize);
            }
          }}
        />
      </Card>

      <Drawer
        title="회원 상세"
        size="large"
        open={selectedUserId !== null}
        onClose={() => {
          setSelectedUserId(null);
          form.resetFields();
        }}
        destroyOnHidden
      >
        {detailQuery.isPending ? <Typography.Text type="secondary">회원 정보를 불러오는 중입니다.</Typography.Text> : null}
        {detailQuery.isError ? <Alert type="error" showIcon message="회원 정보를 불러오지 못했습니다." /> : null}
        {selectedUser ? (
          <div className="drawer-stack">
            <Descriptions title="기본 정보" column={1} bordered size="small">
              <Descriptions.Item label="닉네임">{selectedUser.nickname}</Descriptions.Item>
              <Descriptions.Item label="계정 상태">{userStatusLabels[selectedUser.status]}</Descriptions.Item>
              <Descriptions.Item label="회원 유형">{userRoleLabels[selectedUser.userRole]}</Descriptions.Item>
              <Descriptions.Item label="가입일">{formatDateTime(selectedUser.createdAt)}</Descriptions.Item>
              <Descriptions.Item label="탈퇴일">{formatDateTime(selectedUser.deletedAt)}</Descriptions.Item>
            </Descriptions>

            <Descriptions title="현재 조치" column={1} bordered size="small">
              <Descriptions.Item label="경고 횟수">{selectedUser.warningCount}회</Descriptions.Item>
              <Descriptions.Item label="업로드 제한">
                {renderRestriction(selectedUser.uploadRestricted, selectedUser.uploadRestrictedUntil)}
              </Descriptions.Item>
              <Descriptions.Item label="이용 정지">
                {renderRestriction(selectedUser.suspended, selectedUser.suspendedUntil)}
              </Descriptions.Item>
            </Descriptions>

            <Card title="회원 조치" size="small">
              <Form<UserModerationFormValues>
                form={form}
                layout="vertical"
                requiredMark={false}
                initialValues={{ action: "WARN" }}
                onFinish={moderationMutation.mutate}
              >
                <Form.Item
                  label="조치"
                  name="action"
                  rules={[{ required: true, message: "회원 조치를 선택해주세요." }]}
                >
                  <Select
                    options={directUserActionOptions}
                    onChange={(value) => {
                      if (value === "WARN") {
                        form.setFieldValue("expiresAt", undefined);
                      }
                    }}
                  />
                </Form.Item>
                <Form.Item
                  label="조치 종료 시각"
                  name="expiresAt"
                  rules={[
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        const action = getFieldValue("action");
                        if ((action === "RESTRICT_UPLOAD" || action === "SUSPEND") && !value) {
                          return Promise.reject(new Error("조치 종료 시각을 선택해주세요."));
                        }
                        return Promise.resolve();
                      }
                    })
                  ]}
                >
                  <DatePicker
                    showTime
                    disabled={selectedAction === "WARN"}
                    format="YYYY-MM-DD HH:mm:ss"
                    className="full-width-control"
                  />
                </Form.Item>
                <Form.Item label="관리자 메모" name="adminMemo" rules={[{ max: 500, message: "최대 500자까지 입력할 수 있습니다." }]}>
                  <Input.TextArea rows={4} placeholder="필요한 내용을 남겨주세요." />
                </Form.Item>
                <Button type="primary" htmlType="submit" loading={moderationMutation.isPending}>
                  저장
                </Button>
              </Form>
            </Card>

            <Table<AdminUserModerationHistoryRes>
              rowKey="historyId"
              size="small"
              title={() => "최근 조치 이력"}
              pagination={false}
              dataSource={selectedUser.recentModerations}
              columns={[
                {
                  title: "조치",
                  dataIndex: "action",
                  key: "action",
                  render: (value: UserModerationAction) => userActionLabels[value]
                },
                {
                  title: "종료 시각",
                  dataIndex: "actionExpiresAt",
                  key: "actionExpiresAt",
                  render: formatDateTime
                },
                {
                  title: "메모",
                  dataIndex: "adminMemo",
                  key: "adminMemo",
                  render: (value: string | null) => value || "-"
                },
                {
                  title: "처리 시각",
                  dataIndex: "createdAt",
                  key: "createdAt",
                  render: formatDateTime
                }
              ]}
            />
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}

function renderRestriction(active: boolean, until?: string | null) {
  if (!active) {
    return <Tag>없음</Tag>;
  }
  return <Tag color="red">{until ? `${formatDateTime(until)}까지` : "적용 중"}</Tag>;
}

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }
  return value.slice(0, 10);
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "-";
  }
  return value.replace("T", " ");
}

function normalizeOptionalText(value: string | undefined) {
  const normalized = value?.trim();
  return normalized || undefined;
}
