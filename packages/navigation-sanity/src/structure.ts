import type { StructureResolver } from 'sanity/structure';
import {
  EXPERIENCES,
  EXPERIENCE_METADATA,
  MENU_TYPES,
  MENU_TYPE_LABELS,
} from '@content-ops/navigation-contract';

export const navigationDeskStructure: StructureResolver = (S) =>
  S.list()
    .title('Enterprise Content')
    .items([
      // Canonical Destination Registry (Strangler Fig layer)
      S.listItem()
        .title('Navigation Targets (Canonical URLs)')
        .child(
          S.list()
            .title('Navigation Targets')
            .items([
              S.listItem()
                .title('All Navigation Targets')
                .child(S.documentTypeList('navTarget').title('All Canonical Targets')),
              S.listItem()
                .title('Enterprise Shared Targets')
                .child(
                  S.documentList()
                    .title('Enterprise Shared Targets')
                    .schemaType('navTarget')
                    .filter('_type == "navTarget" && owningExperience == "enterprise"'),
                ),
              S.divider(),
              ...EXPERIENCES.map((exp) =>
                S.listItem()
                  .title(EXPERIENCE_METADATA[exp].shortLabel)
                  .child(
                    S.documentList()
                      .title(`${EXPERIENCE_METADATA[exp].shortLabel} Targets`)
                      .schemaType('navTarget')
                      .filter('_type == "navTarget" && owningExperience == $exp')
                      .params({ exp }),
                  ),
              ),
            ]),
        ),

      // Scoped Navigation Menus: Experience -> Menu Type
      S.listItem()
        .title('Navigation Menus')
        .child(
          S.list()
            .title('Browse Navigation Menus')
            .items([
              ...EXPERIENCES.map((exp) =>
                S.listItem()
                  .title(EXPERIENCE_METADATA[exp].label)
                  .child(
                    S.list()
                      .title(`${EXPERIENCE_METADATA[exp].shortLabel} Menus`)
                      .items([
                        ...MENU_TYPES.map((mt) =>
                          S.listItem()
                            .title(MENU_TYPE_LABELS[mt])
                            .child(
                              S.documentList()
                                .title(`${EXPERIENCE_METADATA[exp].shortLabel} — ${MENU_TYPE_LABELS[mt]}`)
                                .schemaType('navigationMenu')
                                .filter(
                                  '_type == "navigationMenu" && experience == $exp && menuType == $mt',
                                )
                                .params({ exp, mt }),
                            ),
                        ),
                        S.divider(),
                        S.listItem()
                          .title(`All ${EXPERIENCE_METADATA[exp].shortLabel} Menus`)
                          .child(
                            S.documentList()
                              .title(`All ${EXPERIENCE_METADATA[exp].shortLabel} Menus`)
                              .schemaType('navigationMenu')
                              .filter('_type == "navigationMenu" && experience == $exp')
                              .params({ exp }),
                          ),
                      ]),
                  ),
              ),
              S.divider(),
              S.listItem()
                .title('Mobile App Menus')
                .child(
                  S.documentList()
                    .title('Mobile Menus')
                    .schemaType('navigationMenu')
                    .filter('_type == "navigationMenu" && channel == "mobile"'),
                ),
              S.listItem()
                .title('Email Menus')
                .child(
                  S.documentList()
                    .title('Email Menus')
                    .schemaType('navigationMenu')
                    .filter('_type == "navigationMenu" && channel == "email"'),
                ),
              S.listItem()
                .title('Agentic / Conversational Bots')
                .child(
                  S.documentList()
                    .title('Bot Context Menus')
                    .schemaType('navigationMenu')
                    .filter('_type == "navigationMenu" && channel == "agentic"'),
                ),
              S.listItem()
                .title('All Navigation Menus')
                .child(S.documentTypeList('navigationMenu').title('All Menus')),
            ]),
        ),

      S.divider(),

      // Other content types
      ...S.documentTypeListItems().filter(
        (listItem) => !['navigationMenu', 'navTarget'].includes(listItem.getId() || ''),
      ),
    ]);
