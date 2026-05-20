import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { App as AntApp, Alert, Button, Card, DatePicker, Descriptions, Drawer, Form, Input, Select, Space, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import { useEffect, useState } from "react";

import {
  adminQueryKeys,
  getCollectionReport,
  getCollectionReports,
  resolveCollectionReport
} from "../shared/api/adminEndpoints";
import {
  collectionActionLabels,
  reportReasonLabels,
  reportStatusLabels,
  userActionLabels
} from "../shared/api/adminLabels";
import type {
  AdminCollectionReportSummaryRes,
  CollectionModerationAction,
  ReportStatus,
  UserModerationAction
} from "../shared/api/adminTypes";

interface ResolutionFormValues {
  collectionAction: CollectionModerationAction;
  userAction: UserModerationAction;
  userActionExpiresAt?: Dayjs;
  adminMemo?: string;
}

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50];

export function ModerationPage() {
  const { message } = AntApp.useApp();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "ALL">("PENDING");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [form] = Form.useForm<ResolutionFormValues>();
  const listParams = {
    status: statusFilter === "ALL" ? undefined : statusFilter,
    page,
    size: pageSize
  };
  const reportsQuery = useQuery({
    queryKey: adminQueryKeys.collectionReports(listParams),
    queryFn: () => getCollectionReports(listParams)
  });
  const detailQuery = useQuery({
    queryKey: selectedReportId ? adminQueryKeys.collectionReport(selectedReportId) : ["admin", "reports", "collections", "empty"],
    queryFn: () => getCollectionReport(selectedReportId!),
    enabled: selectedReportId !== null
  });
  const resolutionMutation = useMutation({
    mutationFn: (values: ResolutionFormValues) =>
      resolveCollectionReport(selectedReportId!, {
        collectionAction: values.collectionAction,
        userAction: values.userAction,
        userActionExpiresAt: normalizeOptionalDateTime(values.userActionExpiresAt),
        adminMemo: normalizeNullableText(values.adminMemo) ?? undefined
      }),
    onSuccess: async () => {
      void message.success("신고 처리를 완료했습니다.");
      setSelectedReportId(null);
      await queryClient.invalidateQueries({ queryKey: ["admin", "reports", "collections"] });
    }
  });

  useEffect(() => {
    if (!detailQuery.data) {
      return;
    }

    form.setFieldsValue({
      collectionAction: detailQuery.data.report.collectionAction ?? "KEEP",
      userAction: detailQuery.data.report.userAction ?? "KEEP",
      userActionExpiresAt: parseNullableDateTime(detailQuery.data.report.userActionExpiresAt),
      adminMemo: detailQuery.data.report.adminMemo ?? undefined
    });
  }, [detailQuery.data, form]);

  const columns: ColumnsType<AdminCollectionReportSummaryRes> = [
    { title: "컬렉션", dataIndex: "collectionTitle", key: "collectionTitle" },
    {
      title: "신고 사유",
      dataIndex: "reasons",
      key: "reasons",
      render: renderReasons
    },
    { title: "신고자", dataIndex: "reporterNickname", key: "reporterNickname" },
    { title: "소유자", dataIndex: "ownerNickname", key: "ownerNickname" },
    {
      title: "상태",
      dataIndex: "reportStatus",
      key: "reportStatus",
      render: (status: ReportStatus) => (
        <Tag color={status === "PENDING" ? "orange" : "green"}>{reportStatusLabels[status]}</Tag>
      )
    },
    {
      title: "접수 시각",
      dataIndex: "createdAt",
      key: "createdAt",
      render: formatDateTime
    },
    {
      title: "작업",
      key: "action",
      render: (_, report) => (
        <Button type="link" onClick={() => setSelectedReportId(report.reportId)}>
          검토하기
        </Button>
      )
    }
  ];
  const selectedDetail = detailQuery.data;
  const isCollectionPublic = selectedDetail?.collection.isPublic ?? selectedDetail?.collection.public ?? false;

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <Typography.Title level={1}>신고 관리</Typography.Title>
        </div>
      </header>

      <Card
        title="컬렉션 신고 목록"
        extra={
          <Space>
            <Select
              aria-label="신고 상태"
              value={statusFilter}
              className="status-select"
              onChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
              options={[
                { label: "전체", value: "ALL" },
                { label: "처리 대기", value: "PENDING" },
                { label: "처리 완료", value: "RESOLVED" }
              ]}
            />
            <Button onClick={() => reportsQuery.refetch()} loading={reportsQuery.isFetching}>
              새로고침
            </Button>
          </Space>
        }
      >
        {reportsQuery.isError ? <Alert type="error" showIcon message="신고 목록을 불러오지 못했습니다." /> : null}
        <Table
          rowKey="reportId"
          columns={columns}
          dataSource={reportsQuery.data?.data ?? []}
          loading={reportsQuery.isPending}
          pagination={{
            current: page,
            pageSize,
            total: reportsQuery.data?.meta.totalElements ?? 0,
            showSizeChanger: true,
            pageSizeOptions: PAGE_SIZE_OPTIONS,
            showTotal: (total, range) => `${range[0]}-${range[1]} / 전체 ${total}건`,
            onChange: (nextPage, nextPageSize) => {
              setPage(nextPage);
              setPageSize(nextPageSize);
            }
          }}
        />
      </Card>

      <Drawer
        title="신고 검토"
        size="large"
        open={selectedReportId !== null}
        onClose={() => setSelectedReportId(null)}
        destroyOnHidden
      >
        {detailQuery.isPending ? <Typography.Text type="secondary">신고 내용을 불러오는 중입니다.</Typography.Text> : null}
        {detailQuery.isError ? <Alert type="error" showIcon message="신고 내용을 불러오지 못했습니다." /> : null}
        {selectedDetail ? (
          <div className="drawer-stack">
            <Descriptions title="신고 정보" column={1} bordered size="small">
              <Descriptions.Item label="상태">{reportStatusLabels[selectedDetail.report.reportStatus]}</Descriptions.Item>
              <Descriptions.Item label="신고 사유">{renderReasons(selectedDetail.report.reasons)}</Descriptions.Item>
              <Descriptions.Item label="기타 내용">{selectedDetail.report.otherDetail || "-"}</Descriptions.Item>
              <Descriptions.Item label="접수 시각">{formatDateTime(selectedDetail.report.createdAt)}</Descriptions.Item>
              <Descriptions.Item label="처리 시각">{formatDateTime(selectedDetail.report.processedAt)}</Descriptions.Item>
            </Descriptions>

            <Descriptions title="컬렉션" column={1} bordered size="small">
              <Descriptions.Item label="제목">{selectedDetail.collection.title}</Descriptions.Item>
              <Descriptions.Item label="공개 여부">{isCollectionPublic ? "공개" : "비공개"}</Descriptions.Item>
              <Descriptions.Item label="상태">{selectedDetail.collection.moderationStatus}</Descriptions.Item>
              <Descriptions.Item label="북마크 수">{selectedDetail.collection.bookmarkCount}</Descriptions.Item>
            </Descriptions>

            <Descriptions title="사용자" column={1} bordered size="small">
              <Descriptions.Item label="신고자">{selectedDetail.reporter.nickname}</Descriptions.Item>
              <Descriptions.Item label="소유자">{selectedDetail.owner.nickname}</Descriptions.Item>
            </Descriptions>

            <Table
              rowKey="contentId"
              size="small"
              title={() => "컬렉션 포함 콘텐츠"}
              pagination={false}
              dataSource={selectedDetail.contents}
              columns={[
                { title: "제목", dataIndex: "title", key: "title" },
                { title: "메모", dataIndex: "reason", key: "reason", render: (value: string | null) => value || "-" },
                {
                  title: "스포일러",
                  dataIndex: "isSpoiler",
                  key: "isSpoiler",
                  render: (value: boolean) => (value ? "예" : "아니오")
                }
              ]}
            />

            <Card title="처리 내용" size="small">
              <Form<ResolutionFormValues> form={form} layout="vertical" requiredMark={false} onFinish={resolutionMutation.mutate}>
                <Form.Item
                  label="컬렉션 조치"
                  name="collectionAction"
                  rules={[{ required: true, message: "컬렉션 조치를 선택해주세요." }]}
                >
                  <Select
                    options={Object.entries(collectionActionLabels).map(([value, label]) => ({ value, label }))}
                  />
                </Form.Item>
                <Form.Item
                  label="사용자 조치"
                  name="userAction"
                  rules={[{ required: true, message: "사용자 조치를 선택해주세요." }]}
                >
                  <Select
                    options={Object.entries(userActionLabels).map(([value, label]) => ({ value, label }))}
                  />
                </Form.Item>
                <Form.Item label="조치 종료 시각" name="userActionExpiresAt">
                  <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" className="full-width-control" />
                </Form.Item>
                <Form.Item label="관리자 메모" name="adminMemo" rules={[{ max: 500, message: "최대 500자까지 입력할 수 있습니다." }]}>
                  <Input.TextArea rows={4} />
                </Form.Item>
                <Button type="primary" htmlType="submit" loading={resolutionMutation.isPending}>
                  처리 완료
                </Button>
              </Form>
            </Card>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}

function renderReasons(reasons: string[] | undefined) {
  if (!reasons?.length) {
    return "-";
  }

  return (
    <Space size={[4, 4]} wrap>
      {reasons.map((reason) => (
        <Tag key={reason}>{reportReasonLabels[reason as keyof typeof reportReasonLabels] ?? reason}</Tag>
      ))}
    </Space>
  );
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "-";
  }

  return value.replace("T", " ");
}

function normalizeNullableText(value: string | undefined) {
  const normalized = value?.trim();
  return normalized || null;
}

function parseNullableDateTime(value?: string | null) {
  return value ? dayjs(value) : undefined;
}

function normalizeOptionalDateTime(value: Dayjs | undefined) {
  return value ? value.format("YYYY-MM-DDTHH:mm:ss") : null;
}
