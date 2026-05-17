import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { App as AntApp, Alert, Button, Card, Descriptions, Drawer, Form, Input, Select, Space, Switch, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";

import {
  adminQueryKeys,
  getAdminCollection,
  getAdminCollections,
  getAdminContents,
  updateAdminCollection
} from "../shared/api/adminEndpoints";
import { collectionStatusLabels } from "../shared/api/adminLabels";
import type {
  AdminCollectionDetailRes,
  AdminCollectionSummaryRes,
  AdminCollectionUpdateReq,
  AdminCollectionVisibility,
  CollectionModerationStatus,
  MediaType
} from "../shared/api/adminTypes";

interface CollectionFormValues {
  title: string;
  description?: string;
  imageUrl?: string;
  isPublic: boolean;
  contentList: CollectionContentFormValue[];
}

interface CollectionContentFormValue {
  contentId?: number;
  isSpoiler?: boolean;
  reason?: string;
  customImage?: string;
}

type VisibilityFilter = AdminCollectionVisibility | "ALL";
type ModerationStatusFilter = CollectionModerationStatus | "ALL";

export function CollectionsPage() {
  const { message } = AntApp.useApp();
  const queryClient = useQueryClient();
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState<string | undefined>();
  const [visibility, setVisibility] = useState<VisibilityFilter>("ALL");
  const [moderationStatus, setModerationStatus] = useState<ModerationStatusFilter>("ALL");
  const [cursor, setCursor] = useState<string | undefined>();
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(null);
  const [contentSearchKeyword, setContentSearchKeyword] = useState<string | undefined>();
  const [form] = Form.useForm<CollectionFormValues>();
  const listParams = {
    keyword,
    visibility: visibility === "ALL" ? undefined : visibility,
    moderationStatus: moderationStatus === "ALL" ? undefined : moderationStatus,
    cursor,
    size: 10
  };
  const collectionsQuery = useQuery({
    queryKey: adminQueryKeys.collections(listParams),
    queryFn: () => getAdminCollections(listParams)
  });
  const detailQuery = useQuery({
    queryKey: selectedCollectionId ? adminQueryKeys.collection(selectedCollectionId) : ["admin", "collections", "empty"],
    queryFn: () => getAdminCollection(selectedCollectionId!),
    enabled: selectedCollectionId !== null
  });
  const contentOptionsQuery = useQuery({
    queryKey: adminQueryKeys.contents({ keyword: contentSearchKeyword, size: 20 }),
    queryFn: () => getAdminContents({ keyword: contentSearchKeyword, size: 20 }),
    enabled: selectedCollectionId !== null
  });
  const collectionMutation = useMutation({
    mutationFn: ({ collectionId, payload }: { collectionId: number; payload: AdminCollectionUpdateReq }) =>
      updateAdminCollection(collectionId, payload),
    onSuccess: async (collection) => {
      void message.success("컬렉션 정보를 수정했습니다.");
      await queryClient.invalidateQueries({ queryKey: ["admin", "collections"] });
      setSelectedCollectionId(collection.collectionId);
    }
  });

  useEffect(() => {
    if (!detailQuery.data) {
      return;
    }

    form.setFieldsValue(toFormValues(detailQuery.data));
  }, [detailQuery.data, form]);

  const contentOptions = useMemo(() => {
    const optionMap = new Map<number, { label: string; value: number }>();

    detailQuery.data?.contents.forEach((content) => {
      optionMap.set(content.contentId, {
        value: content.contentId,
        label: formatContentOption(content.contentId, content.title, content.mediaType, content.year)
      });
    });
    contentOptionsQuery.data?.data.forEach((content) => {
      optionMap.set(content.id, {
        value: content.id,
        label: formatContentOption(content.id, content.title, content.mediaType, content.year)
      });
    });

    return Array.from(optionMap.values());
  }, [contentOptionsQuery.data?.data, detailQuery.data?.contents]);

  const columns: ColumnsType<AdminCollectionSummaryRes> = [
    { title: "컬렉션 번호", dataIndex: "collectionId", key: "collectionId", width: 110 },
    { title: "제목", dataIndex: "title", key: "title" },
    { title: "작성자", dataIndex: "ownerNickname", key: "ownerNickname", render: (value: string | null) => value || "-" },
    {
      title: "공개 여부",
      dataIndex: "isPublic",
      key: "isPublic",
      width: 100,
      render: (value: boolean) => (value ? "공개" : "비공개")
    },
    {
      title: "상태",
      dataIndex: "moderationStatus",
      key: "moderationStatus",
      width: 100,
      render: (value: CollectionModerationStatus) => <Tag>{collectionStatusLabels[value] ?? value}</Tag>
    },
    { title: "콘텐츠 수", dataIndex: "contentCount", key: "contentCount", width: 100 },
    { title: "저장 수", dataIndex: "bookmarkCount", key: "bookmarkCount", width: 90 },
    {
      title: "작업",
      key: "action",
      width: 100,
      render: (_, collection) => (
        <Button type="link" onClick={() => setSelectedCollectionId(collection.collectionId)}>
          수정하기
        </Button>
      )
    }
  ];

  const handleSearch = (value: string) => {
    setKeyword(normalizeOptionalText(value));
    setCursor(undefined);
  };

  const handleFinish = (values: CollectionFormValues) => {
    if (!selectedCollectionId) {
      return;
    }

    collectionMutation.mutate({
      collectionId: selectedCollectionId,
      payload: buildCollectionPayload(values)
    });
  };

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <Typography.Title level={1}>컬렉션</Typography.Title>
          <Typography.Paragraph>컬렉션을 검색해 기본 정보와 포함 콘텐츠를 수정합니다.</Typography.Paragraph>
        </div>
      </header>

      <Card
        title="컬렉션 목록"
        extra={
          <Space>
            <Input.Search
              allowClear
              placeholder="제목 검색"
              value={keywordInput}
              onChange={(event) => setKeywordInput(event.target.value)}
              onSearch={handleSearch}
            />
            <Select<VisibilityFilter>
              aria-label="공개 여부"
              value={visibility}
              className="status-select"
              onChange={(value) => {
                setVisibility(value);
                setCursor(undefined);
              }}
              options={[
                { label: "전체", value: "ALL" },
                { label: "공개", value: "PUBLIC" },
                { label: "비공개", value: "PRIVATE" }
              ]}
            />
            <Select<ModerationStatusFilter>
              aria-label="컬렉션 상태"
              value={moderationStatus}
              className="status-select"
              onChange={(value) => {
                setModerationStatus(value);
                setCursor(undefined);
              }}
              options={[
                { label: "전체", value: "ALL" },
                { label: "정상", value: "VISIBLE" },
                { label: "숨김", value: "HIDDEN" },
                { label: "삭제됨", value: "DELETED" }
              ]}
            />
            <Button onClick={() => collectionsQuery.refetch()} loading={collectionsQuery.isFetching}>
              새로고침
            </Button>
          </Space>
        }
      >
        {collectionsQuery.isError ? <Alert type="error" showIcon message="컬렉션 목록을 불러오지 못했습니다." /> : null}
        <Table
          rowKey="collectionId"
          columns={columns}
          dataSource={collectionsQuery.data?.data ?? []}
          loading={collectionsQuery.isPending}
          pagination={false}
        />
        <div className="table-actions">
          <Typography.Text type="secondary">
            목록 {collectionsQuery.data?.meta.returned ?? 0}건
            {collectionsQuery.data?.meta.nextCursor ? " · 다음 목록이 있습니다" : ""}
          </Typography.Text>
          <Button
            disabled={!collectionsQuery.data?.meta.nextCursor}
            onClick={() => setCursor(collectionsQuery.data?.meta.nextCursor ?? undefined)}
          >
            다음 목록
          </Button>
        </div>
      </Card>

      <Drawer
        title="컬렉션 정보 수정"
        size="large"
        open={selectedCollectionId !== null}
        onClose={() => setSelectedCollectionId(null)}
        destroyOnHidden
      >
        {detailQuery.isPending ? <Typography.Text type="secondary">컬렉션 정보를 불러오는 중입니다.</Typography.Text> : null}
        {detailQuery.isError ? <Alert type="error" showIcon message="컬렉션 정보를 불러오지 못했습니다." /> : null}
        {detailQuery.data ? (
          <div className="drawer-stack">
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="컬렉션 번호">{detailQuery.data.collectionId}</Descriptions.Item>
              <Descriptions.Item label="작성자">
                {detailQuery.data.owner.nickname || "-"} #{detailQuery.data.owner.userId ?? "-"}
              </Descriptions.Item>
              <Descriptions.Item label="상태">
                {collectionStatusLabels[detailQuery.data.moderationStatus] ?? detailQuery.data.moderationStatus}
              </Descriptions.Item>
              <Descriptions.Item label="저장 수">{detailQuery.data.bookmarkCount}</Descriptions.Item>
            </Descriptions>

            <Form<CollectionFormValues> form={form} layout="vertical" requiredMark={false} onFinish={handleFinish}>
              <Form.Item label="제목" name="title" rules={[{ required: true, message: "제목을 입력해주세요." }]}>
                <Input maxLength={20} />
              </Form.Item>
              <Form.Item label="설명" name="description">
                <Input.TextArea rows={4} maxLength={200} />
              </Form.Item>
              <Form.Item label="대표 이미지 주소" name="imageUrl">
                <Input />
              </Form.Item>
              <Form.Item label="공개 여부" name="isPublic" valuePropName="checked">
                <Switch checkedChildren="공개" unCheckedChildren="비공개" />
              </Form.Item>

              <Form.List name="contentList">
                {(fields, { add, remove }) => (
                  <div className="drawer-stack">
                    <Space align="center" className="form-list-heading">
                      <Typography.Title level={3}>포함 콘텐츠</Typography.Title>
                      <Button icon={<PlusOutlined />} onClick={() => add({ isSpoiler: false })}>
                        추가
                      </Button>
                    </Space>
                    {fields.map((field) => (
                      <Card key={field.key} size="small" title={`콘텐츠 ${field.name + 1}`}>
                        <Form.Item
                          label="콘텐츠"
                          name={[field.name, "contentId"]}
                          rules={[{ required: true, message: "콘텐츠를 선택해주세요." }]}
                        >
                          <Select
                            showSearch
                            filterOption={false}
                            options={contentOptions}
                            onSearch={(value) => setContentSearchKeyword(normalizeOptionalText(value))}
                            placeholder="콘텐츠 제목 검색"
                          />
                        </Form.Item>
                        <Form.Item
                          label="메모"
                          name={[field.name, "reason"]}
                          rules={[{ required: true, message: "메모를 입력해주세요." }]}
                        >
                          <Input.TextArea rows={3} />
                        </Form.Item>
                        <Form.Item label="콘텐츠별 이미지 주소" name={[field.name, "customImage"]}>
                          <Input />
                        </Form.Item>
                        <Form.Item label="스포일러 포함" name={[field.name, "isSpoiler"]} valuePropName="checked">
                          <Switch checkedChildren="예" unCheckedChildren="아니오" />
                        </Form.Item>
                        <Button danger icon={<DeleteOutlined />} onClick={() => remove(field.name)}>
                          제거
                        </Button>
                      </Card>
                    ))}
                  </div>
                )}
              </Form.List>

              <Button type="primary" htmlType="submit" loading={collectionMutation.isPending}>
                저장하기
              </Button>
            </Form>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}

function toFormValues(collection: AdminCollectionDetailRes): CollectionFormValues {
  return {
    title: collection.title,
    description: collection.description ?? undefined,
    imageUrl: collection.imageUrl ?? undefined,
    isPublic: collection.isPublic,
    contentList: collection.contents.map((content) => ({
      contentId: content.contentId,
      isSpoiler: content.isSpoiler,
      reason: content.reason,
      customImage: content.customImageUrl ?? undefined
    }))
  };
}

function buildCollectionPayload(values: CollectionFormValues): AdminCollectionUpdateReq {
  return {
    title: values.title.trim(),
    description: normalizeOptionalText(values.description),
    imageUrl: normalizeOptionalText(values.imageUrl),
    isPublic: values.isPublic,
    contentList: values.contentList.map((content) => ({
      contentId: content.contentId!,
      isSpoiler: content.isSpoiler ?? false,
      reason: content.reason?.trim() ?? "",
      customImage: normalizeOptionalText(content.customImage)
    }))
  };
}

function normalizeOptionalText(value: string | undefined) {
  const normalized = value?.trim();
  return normalized || undefined;
}

function formatContentOption(contentId: number, title: string, mediaType: MediaType, year: number) {
  return `${title} (${formatMediaType(mediaType)} ${year}) #${contentId}`;
}

function formatMediaType(value: MediaType) {
  return value === "MOVIE" ? "영화" : "TV";
}
