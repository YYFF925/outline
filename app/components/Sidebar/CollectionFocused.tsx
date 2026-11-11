import { observer } from "mobx-react";
import { SearchIcon, HomeIcon, SidebarIcon } from "outline-icons";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import styled from "styled-components";
import { light as defaultTheme } from "@shared/styles/theme";
import { metaDisplay } from "@shared/utils/keyboard";
import { createCollection } from "~/actions/definitions/collections";
import { navigateToImport } from "~/actions/definitions/navigation";
import { inviteUser } from "~/actions/definitions/users";
import CollectionSwitcher from "~/components/CollectionSwitcher";
import Scrollable from "~/components/Scrollable";
import Text from "~/components/Text";
import Tooltip from "~/components/Tooltip";
import useCurrentTeam from "~/hooks/useCurrentTeam";
import useCurrentUser from "~/hooks/useCurrentUser";
import { useFocusedCollection } from "~/hooks/useCollectionFocusedNav";
import useMobile from "~/hooks/useMobile";
import usePolicy from "~/hooks/usePolicy";
import useStores from "~/hooks/useStores";
import TeamMenu from "~/menus/TeamMenu";
import type Collection from "~/models/Collection";
import * as Scenes from "~/routes/scenes";
import { FOCUSED_SIDEBAR_WIDTH } from "~/utils/collectionFocusedNav";
import { homePath, searchPath } from "~/utils/routeHelpers";
import TeamLogo from "../TeamLogo";
import {
  DragActiveProvider,
  SidebarScrollProvider,
} from "./components/DragActiveContext";
import ArchiveLink from "./components/ArchiveLink";
import CollectionLinkChildren from "./components/CollectionLinkChildren";
import { DismissableSidebarAction } from "./components/DismissableSidebarAction";
import { DraftsLink } from "./components/DraftsLink";
import DragPlaceholder from "./components/DragPlaceholder";
import DropToImport from "./components/DropToImport";
import HistoryNavigation from "./components/HistoryNavigation";
import PlaceholderCollections from "./components/PlaceholderCollections";
import Section from "./components/Section";
import SharedWithMe from "./components/SharedWithMe";
import SidebarAction from "./components/SidebarAction";
import SidebarButton from "./components/SidebarButton";
import SidebarContext from "./components/SidebarContext";
import SidebarLink from "./components/SidebarLink";
import { SidebarNavigationProvider } from "./components/SidebarNavigation";
import Starred from "./components/Starred";
import ToggleButton from "./components/ToggleButton";
import TrashLink from "./components/TrashLink";
import Sidebar from "./Sidebar";

/**
 * Left sidebar for collection-focused navigation: Home/Search plus the
 * document tree of the currently focused collection.
 *
 * @returns the collection-focused sidebar.
 */
function CollectionFocusedSidebar() {
  const { t } = useTranslation();
  const { documents, ui, collections } = useStores();
  const team = useCurrentTeam();
  const user = useCurrentUser();
  const can = usePolicy(team);
  const history = useHistory();
  const isMobile = useMobile();
  const collection = useFocusedCollection();
  const [scrollArea, setScrollArea] = useState<HTMLElement | null>(null);

  const handleSearchClick = useCallback(() => {
    const basePath = searchPath();
    const { pathname, search } = history.location;
    if (pathname.startsWith(basePath) && (search || pathname !== basePath)) {
      history.push(basePath);
    }
  }, [history]);

  useEffect(() => {
    void collections.fetchAllIfNeeded();

    if (!user.isViewer) {
      void documents.fetchDrafts();
    }
  }, [documents, collections, user.isViewer]);

  // Widen the sidebar once so the document tree has more room than the stock 260px.
  useEffect(() => {
    if (ui.sidebarWidth === defaultTheme.sidebarWidth) {
      ui.set({ sidebarWidth: FOCUSED_SIDEBAR_WIDTH });
    }
  }, [ui]);

  const sidebarContext = collection?.isPersonal ? "personal" : "collections";

  return (
    <Sidebar hidden={!ui.readyToShow}>
      <DragActiveProvider>
        <DragPlaceholder />

        <TeamMenu>
          <SidebarButton
            title={team.name}
            image={<TeamLogo model={team} size={24} alt={t("Logo")} />}
          >
            {isMobile ? null : (
              <Tooltip
                content={t("Toggle sidebar")}
                shortcut={`${metaDisplay}+.`}
              >
                <ToggleButton
                  position="bottom"
                  image={<SidebarIcon />}
                  aria-label={
                    ui.sidebarCollapsed
                      ? t("Expand sidebar")
                      : t("Collapse sidebar")
                  }
                  style={{ paddingInline: 4 }}
                  onClick={() => {
                    ui.toggleCollapsedSidebar();
                    (document.activeElement as HTMLElement)?.blur();
                  }}
                />
              </Tooltip>
            )}
          </SidebarButton>
        </TeamMenu>
        {isMobile && (
          <MobileSwitcher>
            <CollectionSwitcher variant="sidebar" />
          </MobileSwitcher>
        )}
        <Overflow>
          <Section>
            <SidebarLink
              to={homePath()}
              icon={<HomeIcon />}
              exact={false}
              label={t("Home")}
              onClickIntent={Scenes.Home.preload}
            />
            <SidebarLink
              to={searchPath()}
              icon={<SearchIcon />}
              label={t("Search")}
              exact={false}
              onClick={handleSearchClick}
              onClickIntent={Scenes.Search.preload}
            />
            {can.createDocument && <DraftsLink />}
          </Section>
        </Overflow>
        <Scrollable flex shadow ref={setScrollArea}>
          <SidebarScrollProvider value={scrollArea}>
            <SidebarNavigationProvider>
              <SidebarContext.Provider value={sidebarContext}>
                {collection ? (
                  <CollectionTree collection={collection} />
                ) : collections.isLoaded ? (
                  <Section>
                    {can.createCollection ? (
                      <SidebarAction action={createCollection} depth={0} />
                    ) : (
                      <SidebarLink
                        label={
                          <Text type="tertiary" size="small" italic>
                            {t("No collections")}
                          </Text>
                        }
                        onClick={() => {}}
                      />
                    )}
                  </Section>
                ) : (
                  <PlaceholderCollections />
                )}
              </SidebarContext.Provider>
              <Starred />
              <SharedWithMe />
              {can.createDocument && (
                <Section auto>
                  <ArchiveLink />
                </Section>
              )}
            </SidebarNavigationProvider>
            <Section>
              {can.createDocument && <TrashLink />}
              <DismissableSidebarAction
                id="sidebar-import-hidden"
                action={navigateToImport}
              />
              <DismissableSidebarAction
                id="sidebar-invite-hidden"
                action={inviteUser}
              />
            </Section>
          </SidebarScrollProvider>
        </Scrollable>
      </DragActiveProvider>
      <HistoryNavigation />
    </Sidebar>
  );
}

const CollectionTree = observer(function CollectionTree({
  collection,
}: {
  collection: Collection;
}) {
  const { documents } = useStores();
  const can = usePolicy(collection);

  useEffect(() => {
    void Scenes.Collection.preload();
    void collection.fetchDocuments();
  }, [collection]);

  return (
    <Section auto>
      <DropToImport collectionId={collection.id} disabled={!can.createDocument}>
        <LargeDirectory aria-label={collection.displayName}>
          <CollectionLinkChildren
            collection={collection}
            expanded
            depth={0}
            childDepth={0}
            prefetchDocument={documents.prefetchDocument}
          />
        </LargeDirectory>
      </DropToImport>
    </Section>
  );
});

const Overflow = styled.div`
  overflow: hidden;
  flex-shrink: 0;
`;

const MobileSwitcher = styled.div`
  flex-shrink: 0;
  padding: 0 12px 10px;
`;

const LargeDirectory = styled.div`
  && a {
    min-height: 36px;
    padding-block: 6px;
    font-size: 15px;
  }
`;

export default observer(CollectionFocusedSidebar);
