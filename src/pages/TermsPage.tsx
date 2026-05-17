import { useMutation } from "@tanstack/react-query";
import { App as AntApp, Button, Card, DatePicker, Descriptions, Form, Input, InputNumber, Select, Switch, Typography } from "antd";
import type { Dayjs } from "dayjs";

import { createTerms } from "../shared/api/adminEndpoints";
import { termsContextLabels, termsTypeLabels } from "../shared/api/adminLabels";
import type { TermsContext, TermsCreateReq, TermsType } from "../shared/api/adminTypes";

interface TermsFormValues {
  type: TermsType;
  context: TermsContext;
  version: number;
  title: string;
  content: string;
  required: boolean;
  activeAt: Dayjs;
}

export function TermsPage() {
  const { message } = AntApp.useApp();
  const [form] = Form.useForm<TermsFormValues>();
  const termsMutation = useMutation({
    mutationFn: (values: TermsCreateReq) => createTerms(values),
    onSuccess: () => {
      void message.success("약관을 생성했습니다.");
    }
  });

  const handleFinish = (values: TermsFormValues) => {
    termsMutation.mutate({
      ...values,
      title: values.title.trim(),
      content: values.content.trim(),
      activeAt: values.activeAt.format("YYYY-MM-DDTHH:mm:ss")
    });
  };

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <Typography.Title level={1}>약관 관리</Typography.Title>
          <Typography.Paragraph>새 약관을 등록하고 적용 시작 시각을 정합니다.</Typography.Paragraph>
        </div>
      </header>

      <div className="section-grid">
        <Card title="약관 생성">
          <Form<TermsFormValues>
            form={form}
            layout="vertical"
            requiredMark={false}
            initialValues={{ type: "SERVICE", context: "SIGNUP", required: true }}
            onFinish={handleFinish}
          >
            <Form.Item label="약관 유형" name="type" rules={[{ required: true, message: "약관 유형을 선택해주세요." }]}>
              <Select options={toSelectOptions(termsTypeLabels)} />
            </Form.Item>
            <Form.Item label="사용 위치" name="context" rules={[{ required: true, message: "사용 위치를 선택해주세요." }]}>
              <Select options={toSelectOptions(termsContextLabels)} />
            </Form.Item>
            <Form.Item label="버전" name="version" rules={[{ required: true, message: "버전을 입력해주세요." }]}>
              <InputNumber min={1} precision={0} className="full-width-control" />
            </Form.Item>
            <Form.Item label="제목" name="title" rules={[{ required: true, message: "제목을 입력해주세요." }]}>
              <Input maxLength={100} />
            </Form.Item>
            <Form.Item label="본문" name="content" rules={[{ required: true, message: "본문을 입력해주세요." }]}>
              <Input.TextArea rows={8} />
            </Form.Item>
            <Form.Item
              label="적용 시작 시각"
              name="activeAt"
              rules={[{ type: "object" as const, required: true, message: "적용 시작 시각을 선택해주세요." }]}
            >
              <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" className="full-width-control" />
            </Form.Item>
            <Form.Item label="필수 동의 여부" name="required" valuePropName="checked">
              <Switch checkedChildren="필수" unCheckedChildren="선택" />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={termsMutation.isPending}>
              약관 생성
            </Button>
          </Form>
        </Card>

        <Card title="생성 결과">
          {termsMutation.data ? (
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="약관 번호">{termsMutation.data.id}</Descriptions.Item>
              <Descriptions.Item label="유형">{termsTypeLabels[termsMutation.data.type]}</Descriptions.Item>
              <Descriptions.Item label="사용 위치">{termsContextLabels[termsMutation.data.context]}</Descriptions.Item>
              <Descriptions.Item label="버전">{termsMutation.data.version}</Descriptions.Item>
              <Descriptions.Item label="제목">{termsMutation.data.title}</Descriptions.Item>
              <Descriptions.Item label="필수 여부">{termsMutation.data.required ? "필수" : "선택"}</Descriptions.Item>
              <Descriptions.Item label="적용 시작 시각">{termsMutation.data.activeAt.replace("T", " ")}</Descriptions.Item>
            </Descriptions>
          ) : (
            <Typography.Text type="secondary">약관 등록이 완료되면 결과가 여기에 표시됩니다.</Typography.Text>
          )}
        </Card>
      </div>
    </div>
  );
}

function toSelectOptions<T extends string>(labels: Record<T, string>) {
  return Object.keys(labels).map((value) => {
    const typedValue = value as T;

    return {
      value: typedValue,
      label: labels[typedValue]
    };
  });
}
