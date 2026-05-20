import { Card, Empty, Typography } from "antd";

export function AnalyticsPage() {
  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <Typography.Title level={1}>운영 지표</Typography.Title>
        </div>
      </header>

      <Card>
        <Empty description="운영 지표와 처리 이력은 후속 단계에서 제공됩니다." />
      </Card>
    </div>
  );
}
