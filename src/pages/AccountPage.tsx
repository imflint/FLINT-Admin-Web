import { useMutation, useQuery } from "@tanstack/react-query";
import { App as AntApp, Alert, Button, Card, Descriptions, Form, Input, Space, Typography } from "antd";
import { useEffect } from "react";
import { useNavigate } from "react-router";

import { adminQueryKeys, getAdminMe, updateAdminMe } from "../shared/api/adminEndpoints";
import { AdminApiError } from "../shared/api/adminApi";
import type { AdminProfileUpdateReq } from "../shared/api/adminTypes";
import { clearAdminSession } from "../shared/auth/adminSession";

interface AccountFormValues {
  username: string;
  currentPassword: string;
  newPassword?: string;
  confirmNewPassword?: string;
}

export function AccountPage() {
  const { message } = AntApp.useApp();
  const navigate = useNavigate();
  const [form] = Form.useForm<AccountFormValues>();
  const adminMeQuery = useQuery({
    queryKey: adminQueryKeys.me,
    queryFn: getAdminMe
  });
  const updateMutation = useMutation({
    mutationFn: (values: AccountFormValues) => updateAdminMe(buildPayload(values)),
    onSuccess: () => {
      void message.success("계정 정보가 변경되었습니다. 다시 로그인해주세요.");
      clearAdminSession();
      navigate("/login", { replace: true });
    },
    onError: (error) => {
      void message.error(resolveUpdateErrorMessage(error));
    }
  });

  useEffect(() => {
    if (!adminMeQuery.data) {
      return;
    }

    form.setFieldsValue({
      username: adminMeQuery.data.username
    });
  }, [adminMeQuery.data, form]);

  const handleFinish = (values: AccountFormValues) => {
    updateMutation.mutate(values);
  };

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <Typography.Title level={1}>계정 설정</Typography.Title>
          <Typography.Paragraph>관리자 로그인 아이디와 비밀번호를 변경합니다.</Typography.Paragraph>
        </div>
      </header>

      {adminMeQuery.isError ? <Alert type="error" showIcon message="계정 정보를 불러오지 못했습니다." /> : null}

      <Card title="현재 계정">
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="아이디">{adminMeQuery.data?.username ?? "-"}</Descriptions.Item>
          <Descriptions.Item label="비밀번호 변경 시각">
            {formatDateTime(adminMeQuery.data?.passwordChangedAt)}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="계정 정보 수정">
        <Form<AccountFormValues> form={form} layout="vertical" requiredMark={false} onFinish={handleFinish}>
          <Form.Item
            label="아이디"
            name="username"
            rules={[
              { required: true, message: "아이디를 입력해주세요." },
              { max: 100, message: "아이디는 100자 이하여야 합니다." }
            ]}
          >
            <Input autoComplete="username" />
          </Form.Item>
          <Form.Item
            label="현재 비밀번호"
            name="currentPassword"
            rules={[{ required: true, message: "현재 비밀번호를 입력해주세요." }]}
          >
            <Input.Password autoComplete="current-password" />
          </Form.Item>
          <Form.Item label="새 비밀번호" name="newPassword" rules={[{ validator: validateOptionalPassword }]}>
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            label="새 비밀번호 확인"
            name="confirmNewPassword"
            dependencies={["newPassword"]}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value: string | undefined) {
                  const newPassword = getFieldValue("newPassword") as string | undefined;

                  if (!newPassword && !value) {
                    return Promise.resolve();
                  }

                  if (newPassword === value) {
                    return Promise.resolve();
                  }

                  return Promise.reject(new Error("새 비밀번호가 일치하지 않습니다."));
                }
              })
            ]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={updateMutation.isPending}>
              저장하기
            </Button>
          </Space>
        </Form>
      </Card>
    </div>
  );
}

function buildPayload(values: AccountFormValues): AdminProfileUpdateReq {
  return {
    username: values.username.trim(),
    currentPassword: values.currentPassword,
    newPassword: normalizeOptionalText(values.newPassword)
  };
}

function validateOptionalPassword(_: unknown, value: string | undefined) {
  if (!value) {
    return Promise.resolve();
  }

  if (value.length < 8 || value.length > 100) {
    return Promise.reject(new Error("새 비밀번호는 8자 이상 100자 이하로 입력해주세요."));
  }

  return Promise.resolve();
}

function resolveUpdateErrorMessage(error: unknown) {
  if (error instanceof AdminApiError) {
    if (error.problem?.code === "AUTH.INVALID_CREDENTIALS") {
      return "현재 비밀번호가 올바르지 않습니다.";
    }

    if (error.problem?.code === "ADMIN.DUPLICATE_USERNAME") {
      return "이미 사용 중인 아이디입니다.";
    }
  }

  return "계정 정보를 수정하지 못했습니다.";
}

function normalizeOptionalText(value: string | undefined) {
  const normalizedValue = value?.trim();
  return normalizedValue ? normalizedValue : undefined;
}

function formatDateTime(value: string | null | undefined) {
  return value ? value.replace("T", " ") : "-";
}
