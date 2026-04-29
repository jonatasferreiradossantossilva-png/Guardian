import { generateMonthlyInvoices } from './src/ai/flows/generate-monthly-invoices';
import { initialMockData } from './src/lib/mock-data';

(async () => {
    try {
        const result = await generateMonthlyInvoices({
            students: initialMockData.students,
            parents: initialMockData.parents,
            invoices: initialMockData.invoices,
        });
        console.log("Success:", result);
    } catch (e) {
        console.error("Error:", e);
    }
})();
