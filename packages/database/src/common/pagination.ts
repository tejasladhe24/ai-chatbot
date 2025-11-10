export type PaginatedHistory<T extends { id: string }> = {
  items: T[];
  hasMore: boolean;
};

const PAGE_SIZE = 20;

export const getPaginationKey =
  <T extends { id: string }>(url: string, pageSize: number = PAGE_SIZE) =>
  (pageIndex: number, previousPageData: PaginatedHistory<T>) => {
    if (previousPageData && previousPageData.hasMore === false) {
      return null;
    }

    if (pageIndex === 0) {
      return `${url}?limit=${pageSize}`;
    }

    const firstChatFromPage = previousPageData.items.at(-1);

    if (!firstChatFromPage) {
      return null;
    }

    return `${url}?ending_before=${firstChatFromPage.id}&limit=${pageSize}`;
  };
