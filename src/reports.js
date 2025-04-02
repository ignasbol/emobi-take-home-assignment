const generateReport = async (reportId, reportData) => {
  // TODO: create report

  console.log(`Generating report: ${reportId}`);

  return new Promise((resolve) =>
    setTimeout(() => resolve(`Report generated: ${reportId}`), 1000),
  );
};

export {generateReport};
