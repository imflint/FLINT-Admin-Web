import { Card, Empty, Typography } from "antd";

export function AnalyticsPage() {
  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <Typography.Title level={1}>운영 지표</Typography.Title>
          <Typography.Paragraph>
            운영 지표와 감사 로그는 아직 전용 Admin API가 없어 후속 단계에서 연동합니다.
          </Typography.Paragraph>
        </div>
      </header>

      <Card>
        <Empty description="감사 로그와 운영 지표 API는 후속 단계에서 연결합니다." />
      </Card>
    </div>
  );
}
