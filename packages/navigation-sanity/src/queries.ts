/**
 * GROQ query with Smartling fallback:
 * If the localized document for $locale is published, return it.
 * Otherwise, automatically fallback to the canonical 'en-US' document.
 */
export const GET_NAVIGATION_QUERY = `
  coalesce(
    *[_type == "navigationMenu" && channel == $channel && experience == $experience && locale == $locale && !(_id in path("drafts.**"))][0],
    *[_type == "navigationMenu" && channel == $channel && experience == $experience && locale == "en-US" && !(_id in path("drafts.**"))][0]
  ) {
    _id,
    title,
    channel,
    experience,
    locale,
    isCanonical,
    smartling,
    utilityLinks[] {
      id,
      title,
      href,
      icon,
      requiresAuth,
      analyticsTag
    },
    items[] {
      id,
      title,
      href,
      isMegaMenu,
      sections[] {
        id,
        sectionTitle,
        href,
        items[] {
          id,
          title,
          href,
          description,
          badge,
          icon,
          isExternal,
          analyticsTag
        }
      },
      promoCard {
        title,
        description,
        ctaText,
        ctaUrl,
        "imageUrl": image.asset->url,
        badge
      }
    }
  }
`;

export const GET_ALL_NAVIGATION_PATHS_QUERY = `
  *[_type == "navigationMenu" && !(_id in path("drafts.**"))] {
    channel,
    experience,
    locale
  }
`;
