const generateEntryNo = async (model, prefix) => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
  const regex = new RegExp(`^${prefix}-${dateStr}-`);
  
  const lastEntry = await model.findOne({ entryNo: regex }).sort({ entryNo: -1 });
  
  let sequence = 1;
  if (lastEntry) {
    const parts = lastEntry.entryNo.split('-');
    if (parts.length === 3) {
      sequence = parseInt(parts[2], 10) + 1;
    }
  }
  
  return `${prefix}-${dateStr}-${String(sequence).padStart(4, '0')}`;
};

module.exports = { generateEntryNo };
