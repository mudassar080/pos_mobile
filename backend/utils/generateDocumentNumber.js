/**
 * Generate the next sequential document number from the highest existing suffix.
 * Using countDocuments() breaks when records are deleted (duplicate key errors).
 */
async function generateNextDocumentNumber(Model, fieldName, prefix, padLength = 3) {
  const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`^${escapedPrefix}(\\d+)$`);

  const docs = await Model.find({
    [fieldName]: { $regex: `^${escapedPrefix}\\d+$` },
  })
    .select(fieldName)
    .lean();

  let maxNum = 0;
  for (const doc of docs) {
    const match = String(doc[fieldName] || '').match(regex);
    if (match) {
      maxNum = Math.max(maxNum, parseInt(match[1], 10));
    }
  }

  for (let offset = 1; offset <= 1000; offset++) {
    const candidate = `${prefix}${String(maxNum + offset).padStart(padLength, '0')}`;
    const exists = await Model.exists({ [fieldName]: candidate });
    if (!exists) {
      return candidate;
    }
  }

  throw new Error(`Unable to generate unique ${fieldName}`);
}

module.exports = { generateNextDocumentNumber };
