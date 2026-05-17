import { useQuery } from "@tanstack/react-query";
import { Button, Card, Statistic, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Link } from "react-router";

import { adminQueryKeys, getAdminUserStatistics, getCollectionReports } from "../shared/api/adminEndpoints";

interface OperationRow {
  id: string;
  description: string;
  path: string;
  state: string;
}

const columns: ColumnsType<OperationRow> = [
  { title: "작업", dataIndex: "id", key: "id" },
  { title: "설명", dataIndex: "description", key: "description" },
  {
    title: "상태",
    dataIndex: "state",
    key: "state",
    render: (state: string) => <Tag color="blue">{state}</Tag>
  },
  {
    title: "이동",
    key: "path",
    render: (_, row) => (
      <Button size="small">
        <Link to={row.path}>열기</Link>
      </Button>
    )
  }
];

const rows: OperationRow[] = [
  { id: "회원 현황", description: "현재 가입된 회원 수를 확인합니다.", path: "/admin/users", state: "사용 가능" },
  { id: "신고 검토", description: "접수된 컬렉션 신고를 확인하고 처리합니다.", path: "/admin/moderation", state: "사용 가능" },
  { id: "콘텐츠 관리", description: "콘텐츠를 검색하고 제목, 연도, 설명, 장르를 수정합니다.", path: "/admin/content", state: "사용 가능" },
  { id: "컬렉션 관리", description: "컬렉션을 검색하고 포함 콘텐츠를 수정합니다.", path: "/admin/collections", state: "사용 가능" },
  { id: "약관 등록", description: "새 약관을 등록하고 적용 시점을 정합니다.", path: "/admin/terms", state: "사용 가능" },
  { id: "데이터 업데이트", description: "영화, TV, OTT 정보를 최신 상태로 갱신합니다.", path: "/admin/batch", state: "사용 가능" }
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
          <Typography.Paragraph>오늘 확인할 운영 현황과 자주 쓰는 관리 작업을 한곳에서 확인합니다.</Typography.Paragraph>
        </div>
      </header>

      <div className="metric-grid">
        <Card>
          <Statistic
            loading={userStatisticsQuery.isPending}
            title="가입 회원 수"
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
          <Statistic title="콘텐츠·컬렉션" value="목록 관리" />
        </Card>
        <Card>
          <Statistic title="데이터 업데이트" value="4종" />
        </Card>
      </div>

      <Card title="바로 할 수 있는 작업">
        <Table rowKey="id" columns={columns} dataSource={rows} pagination={false} />
      </Card>
    </div>
  );
}
