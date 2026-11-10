import { observer } from "mobx-react";
import { PlusIcon } from "outline-icons";
import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { ellipsis, hideScrollbars, hover, s } from "@shared/styles";
import { CollectionNew } from "~/components/Collection/CollectionNew";
import Flex from "~/components/Flex";
import CollectionIcon from "~/components/Icons/CollectionIcon";
import NudeButton from "~/components/NudeButton";
import { TooltipProvider } from "~/components/TooltipContext";
import Tooltip from "~/components/Tooltip";
import { useComputed } from "~/hooks/useComputed";
import { useFocusedCollection } from "~/hooks/useCollectionFocusedNav";
import usePolicy from "~/hooks/usePolicy";
import useStores from "~/hooks/useStores";
import * as Scenes from "~/routes/scenes";
import { undraggableOnDesktop } from "~/styles";

type Variant = "page" | "sidebar";

type Props = {
  /** Whether the create-collection control is shown. */
  showCreate?: boolean;
  /**
   * `page` is a single row in the content header. `sidebar` wraps inside the
   * mobile drawer.
   */
  variant?: Variant;
};

/**
 * Collection chips for switching the focused collection.
 *
 * @param props Component props.
 * @returns the collection switcher.
 */
function CollectionSwitcher({ showCreate = true, variant = "page" }: Props) {
  const { t } = useTranslation();
  const { collections, ui, dialogs, auth } = useStores();
  const focused = useFocusedCollection();
  const can = usePolicy(auth.team?.id);
  const activeTabRef = useRef<HTMLAnchorElement>(null);

  const items = useComputed(() => {
    const list = [...collections.allActive];

    if (collections.personal) {
      list.push(collections.personal);
    }

    return list;
  }, [collections]);

  useEffect(() => {
    void collections.fetchAllIfNeeded();
  }, [collections]);

  useEffect(() => {
    activeTabRef.current?.scrollIntoView({
      block: "nearest",
      inline: "nearest",
    });
  }, [focused?.id]);

  const handleCreate = useCallback(() => {
    dialogs.openModal({
      title: t("Create a collection"),
      content: <CollectionNew onSubmit={dialogs.closeAllModals} />,
    });
  }, [dialogs, t]);

  return (
    <TooltipProvider>
      <Row align="center" gap={4}>
        <Tabs
          role="navigation"
          aria-label={t("Collections")}
          $variant={variant}
        >
          {items.map((collection) => {
            const isActive = collection.id === focused?.id;

            return (
              <Tab
                key={collection.id}
                ref={isActive ? activeTabRef : undefined}
                to={collection.path}
                $active={isActive}
                $variant={variant}
                aria-current={isActive ? "page" : undefined}
                onClick={() => ui.setFocusedCollectionId(collection.id)}
                onMouseEnter={() => {
                  void Scenes.Collection.preload();
                  void collection.fetchDocuments();
                }}
              >
                <CollectionIcon
                  collection={collection}
                  size={variant === "page" ? 20 : 18}
                  expanded
                />
                <Label>{collection.displayName}</Label>
              </Tab>
            );
          })}
        </Tabs>
        {showCreate && can.createCollection && (
          <Tooltip content={t("New collection")}>
            <CreateButton
              $variant={variant}
              aria-label={t("New collection")}
              onClick={handleCreate}
            >
              <PlusIcon />
            </CreateButton>
          </Tooltip>
        )}
      </Row>
    </TooltipProvider>
  );
}

const Row = styled(Flex)`
  min-width: 0;
  width: 100%;
`;

const Tabs = styled.div<{ $variant: Variant }>`
  display: flex;
  flex-wrap: ${(props) => (props.$variant === "page" ? "nowrap" : "wrap")};
  align-items: center;
  gap: 4px;
  min-width: 0;
  flex: ${(props) => (props.$variant === "page" ? "0 1 auto" : "1")};
  max-height: ${(props) => (props.$variant === "page" ? "none" : "112px")};
  overflow-x: ${(props) => (props.$variant === "page" ? "auto" : "visible")};
  overflow-y: ${(props) => (props.$variant === "page" ? "hidden" : "auto")};
  ${hideScrollbars()}
`;

const Tab = styled(Link)<{ $active?: boolean; $variant: Variant }>`
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 0 0 auto;
  max-width: ${(props) => (props.$variant === "page" ? "220px" : "100%")};
  overflow: hidden;
  height: ${(props) => (props.$variant === "page" ? 36 : 32)}px;
  padding: ${(props) => (props.$variant === "page" ? "0 12px" : "0 10px")};
  border-radius: 6px;
  color: ${(props) =>
    props.$variant === "page"
      ? props.$active
        ? props.theme.text
        : props.theme.textSecondary
      : props.theme.sidebarText};
  background: ${(props) =>
    props.$active
      ? props.$variant === "page"
        ? props.theme.backgroundSecondary
        : props.theme.sidebarActiveBackground
      : "transparent"};
  font-size: ${(props) => (props.$variant === "page" ? 16 : 14)}px;
  font-weight: ${(props) => (props.$active ? 600 : 475)};
  text-decoration: none;
  ${undraggableOnDesktop()}

  &: ${hover} {
    background: ${(props) =>
      props.$active
        ? props.$variant === "page"
          ? props.theme.backgroundSecondary
          : props.theme.sidebarActiveBackground
        : props.$variant === "page"
          ? props.theme.backgroundSecondary
          : props.theme.sidebarHoverBackground};
    color: ${s("text")};
  }
`;

const Label = styled.span`
  min-width: 0;
  ${ellipsis()}
`;

const CreateButton = styled(NudeButton)<{ $variant: Variant }>`
  flex-shrink: 0;
  color: ${(props) =>
    props.$variant === "page"
      ? props.theme.textSecondary
      : props.theme.sidebarText};
  ${undraggableOnDesktop()}
`;

export default observer(CollectionSwitcher);
