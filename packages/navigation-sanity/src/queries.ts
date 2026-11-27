const NAV_TARGET_PROJECTION = `{
  _id,
  title,
  owningExperience,
  destinationType,
  canonicalPath,
  legacyId,
  "internalPageSlug": internalPage->slug.current,
  externalUrl,
  localizedUrlOverrides[] {
    locale,
    url
  },
  description,
  analyticsId,
  status
}`;

const NAV_ITEM_LEAF_FIELDS = `
  "id": coalesce(_key, target->_id, label),
  _key,
  "label": coalesce(label, target->title, "Untitled"),
  target->${NAV_TARGET_PROJECTION},
  "description": coalesce(description, target->description),
  badge,
  icon,
  openInNewTab,
  "analyticsTag": coalesce(analyticsTag, target->analyticsId),
  promoCard {
    title,
    description,
    ctaText,
    ctaUrl,
    "imageUrl": image.asset->url,
    badge
  }
`;

/**
 * Bounded 3-level recursive projection for uniform navItem[].
 * Global Header is capped at 3 levels; Section Navigation is capped at 3 levels under rootTarget.
 */
const NAV_ITEMS_PROJECTION = `navItems[] {
  ${NAV_ITEM_LEAF_FIELDS},
  navItems[] {
    ${NAV_ITEM_LEAF_FIELDS},
    navItems[] {
      ${NAV_ITEM_LEAF_FIELDS}
    }
  }
}`;

/**
 * GROQ query with Smartling fallback:
 * Returns the published localized navigationMenu for ($channel, $experience, $menuType, $locale),
 * falling back to canonical 'en-US' if the requested locale is not yet published.
 */
export const GET_NAVIGATION_QUERY = `
  coalesce(
    *[_type == "navigationMenu" && channel == $channel && experience == $experience && menuType == $menuType && locale == $locale && !(_id in path("drafts.**"))][0],
    *[_type == "navigationMenu" && channel == $channel && experience == $experience && menuType == $menuType && locale == "en-US" && !(_id in path("drafts.**"))][0]
  ) {
    _id,
    title,
    channel,
    experience,
    menuType,
    locale,
    isCanonical,
    smartling,
    rootTarget->${NAV_TARGET_PROJECTION},
    ${NAV_ITEMS_PROJECTION}
  }
`;

/**
 * Fetches all Section Navigation documents (menuType == "section") for an experience & locale
 * (with canonical en-US fallback per rootTarget).
 */
export const GET_SECTION_NAVIGATIONS_QUERY = `
  *[_type == "navigationMenu" && channel == $channel && experience == $experience && menuType == "section" && locale == $locale && !(_id in path("drafts.**"))] {
    _id,
    title,
    channel,
    experience,
    menuType,
    locale,
    isCanonical,
    smartling,
    rootTarget->${NAV_TARGET_PROJECTION},
    ${NAV_ITEMS_PROJECTION}
  }
`;

/**
 * Incoming-reference query powering "Also Used In" visibility for any canonical navTarget.
 */
export const GET_NAV_TARGET_USAGE_QUERY = `
  *[_type == "navigationMenu" && references($targetId) && !(_id in path("drafts.**"))] {
    _id,
    title,
    experience,
    menuType,
    channel,
    locale
  }
`;

export const GET_ALL_NAVIGATION_PATHS_QUERY = `
  *[_type == "navigationMenu" && !(_id in path("drafts.**"))] {
    channel,
    experience,
    menuType,
    locale
  }
`;
