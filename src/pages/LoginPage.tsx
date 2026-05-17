import { useMutation } from "@tanstack/react-query";
import { App as AntApp, Button, Card, Form, Input, Typography } from "antd";
import { Navigate, useLocation, useNavigate } from "react-router";

import { loginAdmin } from "../shared/api/adminEndpoints";
import { saveAdminSession, useAdminSession } from "../shared/auth/adminSession";

interface LoginFormValues {
  username: string;
  password: string;
}

export function LoginPage() {
  const { message } = AntApp.useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const session = useAdminSession();
  const fromPath = resolveRedirectPath(location.state);
  const loginMutation = useMutation({
    mutationFn: loginAdmin,
    onSuccess: (loginResponse) => {
      saveAdminSession(loginResponse);
      void message.success("로그인했습니다.");
      navigate(fromPath, { replace: true });
    },
    onError: () => {
      void message.error("아이디 또는 비밀번호를 확인해주세요.");
    }
  });

  const handleFinish = (values: LoginFormValues) => {
    loginMutation.mutate(values);
  };

  if (session) {
    return <Navigate to="/admin/overview" replace />;
  }

  return (
    <main className="login-page">
      <Card className="login-card">
        <Typography.Title level={1}>관리자 로그인</Typography.Title>
        <Typography.Paragraph type="secondary">
          Flint 운영자 콘솔에 접근하려면 관리자 계정으로 로그인해주세요.
        </Typography.Paragraph>
        <Form<LoginFormValues> layout="vertical" requiredMark={false} onFinish={handleFinish}>
          <Form.Item label="아이디" name="username" rules={[{ required: true, message: "아이디를 입력해주세요." }]}>
            <Input autoComplete="username" />
          </Form.Item>
          <Form.Item label="비밀번호" name="password" rules={[{ required: true, message: "비밀번호를 입력해주세요." }]}>
            <Input.Password autoComplete="current-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={loginMutation.isPending}>
            로그인
          </Button>
        </Form>
      </Card>
    </main>
  );
}

function resolveRedirectPath(state: unknown) {
  const from = (state as { from?: { pathname?: string; search?: string } } | null)?.from;

  if (!from?.pathname || from.pathname === "/login") {
    return "/admin/overview";
  }

  return `${from.pathname}${from.search ?? ""}`;
}
