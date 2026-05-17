import { useQuery } from "@tanstack/react-query";
import { Card, Statistic, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";

import { adminQueryKeys, getAdminUserStatistics, getCollectionReports } from "../shared/api/adminEndpoints";

interface ApiStatusRow {
  id: string;
  endpoint: string;
  scope: string;
  state: string;
}

const columns: ColumnsType<ApiStatusRow> = [
  { title: "기능", dataIndex: "id", key: "id" },
  { title: "엔드포인트", dataIndex: "endpoint", key: "endpoint" },
  { title: "화면", dataIndex: "scope", key: "scope" },
  {
    title: "상태",
    dataIndex: "state",
    key: "state",
    render: (state: string) => <Tag color="blue">{state}</Tag>
  }
];

const rows: ApiStatusRow[] = [
  { id: "로그인", endpoint: "POST /admin/auth/login", scope: "관리자 로그인", state: "연동 완료" },
  { id: "사용자 통계", endpoint: "GET /admin/users/statistics", scope: "사용자", state: "연동 완료" },
  { id: "컬렉션 신고", endpoint: "GET/PATCH /admin/reports/collections", scope: "신고 관리", state: "연동 완료" },
  { id: "콘텐츠 수정", endpoint: "PATCH /admin/contents/{contentId}", scope: "콘텐츠", state: "연동 완료" },
  { id: "약관 생성", endpoint: "POST /admin/terms", scope: "약관 관리", state: "연동 완료" },
  { id: "TMDB 배치", endpoint: "POST /admin/batch/*", scope: "배치 실행", state: "연동 완료" }
];

export function OverviewPage() {
  const userStatisticsQuery = useQuery({
    queryKey: adminQueryKeys.userStatistics,
    queryFn: getAdminUserStatistics
  });
  const pendingReportsQuery = useQuery({
    queryKey: adminQueryKeys.collectionReports({ status: "PENDING", size: 5 }),
    queryFn: () => getCollectionReports({ status: "PENDING", size: 5 })
  });

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <Typography.Title level={1}>대시보드</Typography.Title>
          <Typography.Paragraph>
            현재 백엔드에 구현된 Admin API의 주요 운영 상태를 실제 응답으로 확인합니다.
          </Typography.Paragraph>
        </div>
      </header>

      <div className="metric-grid">
        <Card>
          <Statistic
            loading={userStatisticsQuery.isPending}
            title="활성 사용자 수"
            value={userStatisticsQuery.data?.activeUserCount ?? 0}
          />
        </Card>
        <Card>
          <Statistic
            loading={pendingReportsQuery.isPending}
            title="처리 대기 신고"
            suffix="건"
            value={pendingReportsQuery.data?.meta.returned ?? 0}
          />
        </Card>
        <Card>
          <Statistic title="콘텐츠 수정" value="단건 수정" />
        </Card>
        <Card>
          <Statistic title="배치 실행" value="4종" />
        </Card>
      </div>

      <Card title="연동된 Admin API">
        <Table rowKey="id" columns={columns} dataSource={rows} pagination={false} />
      </Card>
    </div>
  );
}
