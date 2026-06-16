/**
 * Parse page/limit from query string. Both must be sent by the client.
 * @returns {{ page: number, limit: number, skip: number } | null}
 */
function parsePagination(req, res) {
  const { page, limit } = req.query;

  if (page == null || page === '' || limit == null || limit === '') {
    res.status(400).json({
      success: false,
      message: 'Query parameters page and limit are required',
    });
    return null;
  }

  const pageNum = parseInt(String(page), 10);
  const limitNum = parseInt(String(limit), 10);

  if (
    !Number.isInteger(pageNum) ||
    pageNum < 1 ||
    !Number.isInteger(limitNum) ||
    limitNum < 1
  ) {
    res.status(400).json({
      success: false,
      message: 'page and limit must be positive integers',
    });
    return null;
  }

  return {
    page: pageNum,
    limit: limitNum,
    skip: (pageNum - 1) * limitNum,
  };
}

function buildPaginationMeta(page, limit, total) {
  return {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit) || 1,
  };
}

module.exports = {
  parsePagination,
  buildPaginationMeta,
};
