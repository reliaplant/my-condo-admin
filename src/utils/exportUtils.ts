// import { saveAs } from 'file-saver';
// import { utils, write } from 'xlsx';
// import { jsPDF } from 'jspdf';
// import autoTable from 'jspdf-autotable';
// import { format } from 'date-fns';
// import { DashboardMetrics, VehicleRecord } from '@/types';

// /**
//  * Export dashboard metrics to Excel
//  */
// export const exportDashboardToExcel = (data: DashboardMetrics) => {
//   // Prepare worksheets for different sections
//   const ws1 = utils.json_to_sheet([
//     { 
//       'Total Entries': data.totalEntries,
//       'Total Exits': data.totalExits,
//       'Today Visitors': data.totalVisitors.today,
//       'Week Visitors': data.totalVisitors.week,
//       'Month Visitors': data.totalVisitors.month,
//       'Average Stay Time (min)': data.averageStayTime,
//     }
//   ]);
  
//   // Visitors by hour
//   const ws2 = utils.json_to_sheet(data.entriesByHour.map(item => ({
//     'Hour': `${item.hour}:00`,
//     'Count': item.count
//   })));
  
//   // Entry/Exit trend
//   const ws3 = utils.json_to_sheet(data.entryExitTrend);
  
//   // Visits by block
//   const ws4 = utils.json_to_sheet(
//     Object.entries(data.visitsByBlock).map(([block, count]) => ({
//       'Block': block,
//       'Visits': count
//     }))
//   );
  
//   // Incidents
//   const ws5 = utils.json_to_sheet([{
//     'Open': data.incidentStats.open,
//     'In Progress': data.incidentStats.inProgress,
//     'Resolved': data.incidentStats.resolved
//   }]);
  
//   // Top visitors
//   const ws6 = utils.json_to_sheet(data.topVisitors);
  
//   // Create workbook and add worksheets
//   const wb = utils.book_new();
//   utils.book_append_sheet(wb, ws1, 'Summary');
//   utils.book_append_sheet(wb, ws2, 'Visitors by Hour');
//   utils.book_append_sheet(wb, ws3, 'Entry/Exit Trend');
//   utils.book_append_sheet(wb, ws4, 'Visits by Block');
//   utils.book_append_sheet(wb, ws5, 'Incidents');
//   utils.book_append_sheet(wb, ws6, 'Top Visitors');
  
//   // Generate Excel file
//   const excelBuffer = write(wb, { bookType: 'xlsx', type: 'array' });
//   const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
  
//   // Save file
//   saveAs(blob, `dashboard-metrics-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
// };

// /**
//  * Export dashboard metrics to PDF
//  */
// export const exportDashboardToPDF = (data: DashboardMetrics) => {
//   const doc = new jsPDF();
  
//   // Add title
//   doc.setFontSize(18);
//   doc.text('MyCondo Dashboard Report', 14, 22);
  
//   doc.setFontSize(12);
//   doc.text(`Generated on: ${format(new Date(), 'PPpp')}`, 14, 30);
  
//   // Summary table
//   autoTable(doc, {
//     head: [['Metric', 'Value']],
//     body: [
//       ['Total Entries', data.totalEntries.toString()],
//       ['Total Exits', data.totalExits.toString()],
//       ['Today\'s Visitors', data.totalVisitors.today.toString()],
//       ['Weekly Visitors', data.totalVisitors.week.toString()],
//       ['Monthly Visitors', data.totalVisitors.month.toString()],
//       ['Avg. Stay Time (min)', data.averageStayTime.toString()],
//     ],
//     startY: 40,
//   });
  
//   // Visits by block table
//   const blockData = Object.entries(data.visitsByBlock).map(([block, count]) => [
//     `Block ${block}`, count.toString()
//   ]);
  
//   autoTable(doc, {
//     head: [['Block', 'Visits']],
//     body: blockData,
//     startY: doc.lastAutoTable.finalY + 15,
//   });
  
//   // Incidents table
//   autoTable(doc, {
//     head: [['Status', 'Count']],
//     body: [
//       ['Open', data.incidentStats.open.toString()],
//       ['In Progress', data.incidentStats.inProgress.toString()],
//       ['Resolved', data.incidentStats.resolved.toString()],
//     ],
//     startY: doc.lastAutoTable.finalY + 15,
//   });
  
//   // Top visitors table
//   const visitorData = data.topVisitors.map(visitor => [
//     visitor.name, visitor.count.toString()
//   ]);
  
//   autoTable(doc, {
//     head: [['Name', 'Visits']],
//     body: visitorData,
//     startY: doc.lastAutoTable.finalY + 15,
//   });
  
//   // Save the PDF
//   doc.save(`dashboard-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
// };

// /**
//  * Export vehicle records to Excel
//  */
// export const exportVehicleRecordsToExcel = (records: VehicleRecord[]) => {
//   const data = records.map(record => ({
//     'Driver Name': record.driverName,
//     'License Plate': record.licensePlate,
//     'House': `${record.houseBlock}-${record.houseNumber}`,
//     'Type': record.entryType,
//     'Date': format(record.createdAt, 'yyyy-MM-dd'),
//     'Time': format(record.createdAt, 'HH:mm:ss'),
//     'Processed': record.processed ? 'Yes' : 'No'
//   }));
  
//   // Create worksheet
//   const worksheet = utils.json_to_sheet(data);
  
//   // Create workbook
//   const workbook = utils.book_new();
//   utils.book_append_sheet(workbook, worksheet, 'Vehicle Records');
  
//   // Generate Excel file
//   const excelBuffer = write(workbook, { bookType: 'xlsx', type: 'array' });
//   const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
  
//   // Save file
//   saveAs(blob, `vehicle-records-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
// };
