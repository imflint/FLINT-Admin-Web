import {
  CloudSyncOutlined,
  DashboardOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  LogoutOutlined,
  SafetyOutlined,
  VideoCameraOutlined
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { Button, Layout, Menu, Typography } from "antd";
import type { MenuProps } from "antd";
import type { ReactNode } from "react";
import { Link, Navigate, Outlet, Route, Routes, useLocation, useNavigate } from "react-router";

import { BatchPage } from "../pages/BatchPage";
import { CollectionsPage } from "../pages/CollectionsPage";
import { ContentPage } from "../pages/ContentPage";
import { LoginPage } from "../pages/LoginPage";
import { ModerationPage } from "../pages/ModerationPage";
import { OverviewPage } from "../pages/OverviewPage";
import { TermsPage } from "../pages/TermsPage";
import { UsersPage } from "../pages/UsersPage";
import { adminQueryKeys, getAdminUserStatistics } from "../shared/api/adminEndpoints";
import { clearAdminSession, useAdminSession } from "../shared/auth/adminSession";

const { Header, Content, Sider } = Layout;

const navigationItems: MenuProps["items"] = [
  {
    key: "/admin/overview",
    icon: <DashboardOutlined />,
    label: <Link to="/admin/overview">대시보드</Link>
  },
  {
    key: "/admin/content",
    icon: <VideoCameraOutlined />,
    label: <Link to="/admin/content">콘텐츠</Link>
  },
  {
    key: "/admin/collections",
    icon: <FolderOpenOutlined />,
    label: <Link to="/admin/collections">컬렉션</Link>
  },
  {
    key: "/admin/moderation",
    icon: <SafetyOutlined />,
    label: <Link to="/admin/moderation">신고 관리</Link>
  },
  {
    key: "/admin/terms",
    icon: <FileTextOutlined />,
    label: <Link to="/admin/terms">약관 관리</Link>
  },
  {
    key: "/admin/batch",
    icon: <CloudSyncOutlined />,
    label: <Link to="/admin/batch">데이터 업데이트</Link>
  }
];

function resolveSelectedKey(pathname: string) {
  return navigationItems
    ?.map((item) => String(item?.key))
    .find((key) => pathname === key || pathname.startsWith(`${key}/`)) ?? "/admin/overview";
}

function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const selectedKey = resolveSelectedKey(location.pathname);
  const userStatisticsQuery = useQuery({
    queryKey: adminQueryKeys.userStatistics,
    queryFn: getAdminUserStatistics,
    staleTime: 60_000
  });
  const handleLogout = () => {
    clearAdminSession();
    navigate("/login", { replace: true });
  };

  return (
    <Layout className="admin-layout">
      <Sider className="admin-sider" width={256}>
        <Link to="/admin/overview" className="admin-brand" aria-label="Flint 관리자 대시보드">
          <span className="admin-brand-mark">F</span>
          <span>
            <strong>Flint 관리자</strong>
            <small>운영 관리</small>
          </span>
        </Link>
        <Menu mode="inline" selectedKeys={[selectedKey]} items={navigationItems} />
      </Sider>
      <Layout>
        <Header className="admin-header">
          <Typography.Text type="secondary">Flint 운영 관리</Typography.Text>
          <div className="admin-header-actions">
            <Typography.Text type="secondary">
              가입 회원 {userStatisticsQuery.data?.activeUserCount ?? "-"}명
            </Typography.Text>
            <Typography.Text type="secondary">관리자 계정</Typography.Text>
            <Button icon={<LogoutOutlined />} onClick={handleLogout}>
              로그아웃
            </Button>
          </div>
        </Header>
        <Content className="admin-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

function RequireAdminAuth({ children }: { children: ReactNode }) {
  const session = useAdminSession();
  const location = useLocation();

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin/overview" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/admin"
        element={
          <RequireAdminAuth>
            <AdminLayout />
          </RequireAdminAuth>
        }
      >
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<OverviewPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="content" element={<ContentPage />} />
        <Route path="collections" element={<CollectionsPage />} />
        <Route path="moderation" element={<ModerationPage />} />
        <Route path="terms" element={<TermsPage />} />
        <Route path="batch" element={<BatchPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/admin/overview" replace />} />
    </Routes>
  );
}
