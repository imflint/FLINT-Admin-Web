import { useQuery } from "@tanstack/react-query";
import { Alert, Card, Statistic, Typography } from "antd";

import { adminQueryKeys, getAdminUserStatistics } from "../shared/api/adminEndpoints";

export function UsersPage() {
  const userStatisticsQuery = useQuery({
    queryKey: adminQueryKeys.userStatistics,
    queryFn: getAdminUserStatistics
  });

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <Typography.Title level={1}>사용자</Typography.Title>
          <Typography.Paragraph>현재 가입된 회원 수를 확인합니다.</Typography.Paragraph>
        </div>
      </header>

      {userStatisticsQuery.isError ? (
        <Alert type="error" showIcon message="가입 회원 수를 불러오지 못했습니다." />
      ) : null}

      <div className="metric-grid">
        <Card>
          <Statistic
            loading={userStatisticsQuery.isPending}
            title="가입 회원 수"
            suffix="명"
            value={userStatisticsQuery.data?.activeUserCount ?? 0}
          />
        </Card>
      </div>
    </div>
  );
}
