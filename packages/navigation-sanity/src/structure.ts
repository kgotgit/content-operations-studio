import type { StructureResolver } from 'sanity/structure';

export const navigationDeskStructure: StructureResolver = (S) =>
  S.list()
    .title('Enterprise Content')
    .items([
      // Dedicated Navigation Section
      S.listItem()
        .title('Navigation Menus')
        .child(
          S.list()
            .title('Channels')
            .items([
              S.listItem()
                .title('Web Menus')
                .child(
                  S.list()
                    .title('Experiences (Flavors)')
                    .items([
                      S.listItem()
                        .title('General / Prospects (Retail)')
                        .child(
                          S.documentList()
                            .title('General Navigation by Locale')
                            .schemaType('navigationMenu')
                            .filter('_type == "navigationMenu" && channel == "web" && experience == "general"'),
                        ),
                      S.listItem()
                        .title('Workplace & Retirement')
                        .child(
                          S.documentList()
                            .title('Retirement Navigation by Locale')
                            .schemaType('navigationMenu')
                            .filter('_type == "navigationMenu" && channel == "web" && experience == "retirement"'),
                        ),
                      S.listItem()
                        .title('Advisor Services')
                        .child(
                          S.documentList()
                            .title('Advisor Navigation by Locale')
                            .schemaType('navigationMenu')
                            .filter('_type == "navigationMenu" && channel == "web" && experience == "advisorservices"'),
                        ),
                    ]),
                ),
              S.listItem()
                .title('Mobile App Menus')
                .child(
                  S.documentList()
                    .title('Mobile Menus')
                    .schemaType('navigationMenu')
                    .filter('_type == "navigationMenu" && channel == "mobile"'),
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
                .title('All Navigation Documents')
                .child(S.documentTypeList('navigationMenu').title('All Menus')),
            ]),
        ),

      S.divider(),

      // Other content types
      ...S.documentTypeListItems().filter(
        (listItem) => listItem.getId() !== 'navigationMenu',
      ),
    ]);
