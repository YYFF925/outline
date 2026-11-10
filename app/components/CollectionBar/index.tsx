import { observer } from "mobx-react";
import { useEffect } from "react";
import styled from "styled-components";
import { breakpoint } from "@shared/styles/breakpoint";
import { depths, s } from "@shared/styles";
import useMobile from "~/hooks/useMobile";
import { draggableOnDesktop } from "~/styles";
import { COLLECTION_BAR_HEIGHT } from "~/utils/collectionFocusedNav";
import CollectionSwitcher from "./CollectionSwitcher";

/**
 * Full-width collection switcher shown above the sidebar and content.
 *
 * Sets `--collection-bar-height` so the sidebar, page header, and content
 * offset themselves without further layout changes. Hidden on mobile, where
 * the switcher lives inside the sidebar drawer instead.
 *
 * @returns the collection bar, or null on mobile.
 */
function CollectionBar() {
  const isMobile = useMobile();

  useEffect(() => {
    if (isMobile) {
      document.documentElement.style.removeProperty("--collection-bar-height");
      return;
    }

    document.documentElement.style.setProperty(
      "--collection-bar-height",
      `${COLLECTION_BAR_HEIGHT}px`
    );

    return () => {
      document.documentElement.style.removeProperty("--collection-bar-height");
    };
  }, [isMobile]);

  if (isMobile) {
    return null;
  }

  return (
    <Bar>
      <CollectionSwitcher />
    </Bar>
  );
}

const Bar = styled.div`
  position: fixed;
  top: 0;
  inset-inline: 0;
  z-index: ${depths.sidebar};
  display: flex;
  align-items: center;
  box-sizing: border-box;
  height: ${COLLECTION_BAR_HEIGHT}px;
  padding-inline: 8px;
  padding-inline-start: max(8px, var(--sal, 0px));
  background: ${s("sidebarBackground")};
  border-bottom: 1px solid ${s("divider")};
  ${draggableOnDesktop()}

  ${breakpoint("mobile", "tablet")`
    display: none;
  `}
`;

export default observer(CollectionBar);
