import { useState } from "react";

import MDEditor from "@uiw/react-md-editor/nohighlight";
import type { MarkdownPreviewProps } from "@uiw/react-markdown-preview";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  App as AntApp,
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { Dayjs } from "dayjs";
import rehypeSanitize from "rehype-sanitize";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

import { adminQueryKeys, createTerms, getTerms } from "../shared/api/adminEndpoints";
import { termsContextLabels, termsTypeLabels } from "../shared/api/adminLabels";
import type {
  SortDirection,
  TermsContext,
  TermsCreateReq,
  TermsRes,
  TermsSortBy,
  TermsType
} from "../shared/api/adminTypes";

interface TermsFormValues {
  type: TermsType;
  context: TermsContext;
  version: number;
  title: string;
  content: string;
  required: boolean;
  activeAt: Dayjs;
}

interface TermsFilterState {
  type?: TermsType;
  sortBy: TermsSortBy;
  direction: SortDirection;
}

const markdownPreviewOptions = {
  rehypePlugins: [rehypeSanitize]
} satisfies Omit<MarkdownPreviewProps, "source">;

export function TermsPage() {
  const { message } = AntApp.useApp();
  const [form] = Form.useForm<TermsFormValues>();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<TermsFilterState>({
    sortBy: "VERSION",
    direction: "DESC"
  });
  const [selectedTerms, setSelectedTerms] = useState<TermsRes | null>(null);
  const termsQuery = useQuery({
    queryKey: adminQueryKeys.terms(filters),
    queryFn: () => getTerms(filters)
  });
  const termsMutation = useMutation({
    mutationFn: (values: TermsCreateReq) => createTerms(values),
    onSuccess: () => {
      void message.success("약관을 생성했습니다.");
      void queryClient.invalidateQueries({ queryKey: ["admin", "terms"] });
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
        </div>
      </header>

      <Card title="약관 목록">
        <Space wrap size="middle">
          <LabeledSelect
            label="약관 유형"
            value={filters.type ?? "ALL"}
            options={[{ value: "ALL", label: "전체" }, ...toSelectOptions(termsTypeLabels)]}
            onChange={(value) => {
              setFilters((current) => ({
                ...current,
                type: value === "ALL" ? undefined : (value as TermsType)
              }));
            }}
          />
          <LabeledSelect
            label="정렬 기준"
            value={filters.sortBy}
            options={toSelectOptions(termsSortByLabels)}
            onChange={(value) => {
              setFilters((current) => ({
                ...current,
                sortBy: value as TermsSortBy
              }));
            }}
          />
          <LabeledSelect
            label="정렬 방향"
            value={filters.direction}
            options={toSelectOptions(sortDirectionLabels)}
            onChange={(value) => {
              setFilters((current) => ({
                ...current,
                direction: value as SortDirection
              }));
            }}
          />
        </Space>
        <Table<TermsRes>
          rowKey="id"
          columns={createTermsColumns(setSelectedTerms)}
          dataSource={termsQuery.data ?? []}
          loading={termsQuery.isLoading}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          style={{ marginTop: 16 }}
        />
      </Card>

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
            <TermsMarkdownEditor />
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

      <Modal
        title={selectedTerms?.title}
        open={selectedTerms !== null}
        width={760}
        footer={null}
        onCancel={() => setSelectedTerms(null)}
        destroyOnHidden
      >
        {selectedTerms ? (
          <Space orientation="vertical" size="middle" className="full-width-control">
            <Typography.Text type="secondary">
              {termsTypeLabels[selectedTerms.type]} · {termsContextLabels[selectedTerms.context]} · 버전 {selectedTerms.version}
            </Typography.Text>
            <div className="terms-markdown" data-color-mode="light">
              <MDEditor.Markdown source={selectedTerms.content} {...markdownPreviewOptions} />
            </div>
          </Space>
        ) : null}
      </Modal>
    </div>
  );
}

interface TermsMarkdownEditorProps {
  value?: string;
  onChange?: (value: string) => void;
}

function TermsMarkdownEditor({ value = "", onChange }: TermsMarkdownEditorProps) {
  return (
    <div className="terms-markdown-editor" data-color-mode="light">
      <MDEditor
        value={value}
        height={360}
        preview="live"
        visibleDragbar={false}
        previewOptions={markdownPreviewOptions}
        textareaProps={{ "aria-label": "본문" }}
        onChange={(nextValue) => onChange?.(nextValue ?? "")}
      />
    </div>
  );
}

const termsSortByLabels: Record<TermsSortBy, string> = {
  VERSION: "버전순",
  TYPE: "약관 종류순"
};

const sortDirectionLabels: Record<SortDirection, string> = {
  DESC: "내림차순",
  ASC: "오름차순"
};

function createTermsColumns(onOpenContent: (terms: TermsRes) => void): ColumnsType<TermsRes> {
  return [
    {
      title: "약관 유형",
      dataIndex: "type",
      render: (type: TermsType) => termsTypeLabels[type]
    },
    {
      title: "사용 위치",
      dataIndex: "context",
      render: (context: TermsContext) => termsContextLabels[context]
    },
    {
      title: "버전",
      dataIndex: "version",
      width: 80
    },
    {
      title: "제목",
      dataIndex: "title"
    },
    {
      title: "필수 여부",
      dataIndex: "required",
      render: (required: boolean) => <Tag color={required ? "red" : "default"}>{required ? "필수" : "선택"}</Tag>
    },
    {
      title: "적용 시작 시각",
      dataIndex: "activeAt",
      render: formatDateTime
    },
    {
      title: "상세",
      key: "content",
      width: 110,
      render: (_, record) => (
        <Button type="link" onClick={() => onOpenContent(record)}>
          본문 보기
        </Button>
      )
    }
  ];
}

interface LabeledSelectProps {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}

function LabeledSelect({ label, value, options, onChange }: LabeledSelectProps) {
  return (
    <Space orientation="vertical" size={4}>
      <Typography.Text type="secondary">{label}</Typography.Text>
      <Select value={value} options={options} onChange={onChange} className="status-select" />
    </Space>
  );
}

function formatDateTime(value: string) {
  return value.replace("T", " ");
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
