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

type Props = {
  /** Whether the create-collection control is shown. */
  showCreate?: boolean;
};

/**
 * Horizontal list of collections used by the top bar and the mobile sidebar.
 *
 * @param props Component props.
 * @returns the collection switcher.
 */
function CollectionSwitcher({ showCreate = true }: Props) {
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
        <Tabs role="navigation" aria-label={t("Collections")}>
          {items.map((collection) => {
            const isActive = collection.id === focused?.id;

            return (
              <Tab
                key={collection.id}
                ref={isActive ? activeTabRef : undefined}
                to={collection.path}
                $active={isActive}
                aria-current={isActive ? "page" : undefined}
                onClick={() => ui.setFocusedCollectionId(collection.id)}
                onMouseEnter={() => {
                  void Scenes.Collection.preload();
                  void collection.fetchDocuments();
                }}
              >
                <CollectionIcon collection={collection} size={20} expanded />
                <Label>{collection.displayName}</Label>
              </Tab>
            );
          })}
        </Tabs>
        {showCreate && can.createCollection && (
          <Tooltip content={t("New collection")}>
            <CreateButton
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

const Tabs = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  flex: 1;
  overflow-x: auto;
  ${hideScrollbars()}
`;

const Tab = styled(Link)<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  max-width: 220px;
  overflow: hidden;
  height: 32px;
  padding: 0 10px;
  border-radius: 6px;
  color: ${s("sidebarText")};
  background: ${(props) =>
    props.$active ? props.theme.sidebarActiveBackground : "transparent"};
  font-size: 14px;
  font-weight: ${(props) => (props.$active ? 600 : 475)};
  text-decoration: none;
  ${undraggableOnDesktop()}

  &: ${hover} {
    background: ${(props) =>
      props.$active
        ? props.theme.sidebarActiveBackground
        : props.theme.sidebarHoverBackground};
    color: ${s("text")};
  }
`;

const Label = styled.span`
  min-width: 0;
  ${ellipsis()}
`;

const CreateButton = styled(NudeButton)`
  flex-shrink: 0;
  color: ${s("sidebarText")};
  ${undraggableOnDesktop()}
`;

export default observer(CollectionSwitcher);
