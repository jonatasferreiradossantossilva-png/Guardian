'use server';

/**
 * @fileOverview A server-side flow to calculate which monthly invoices need to be generated.
 * This encapsulates the business logic for invoice creation.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { format, startOfMonth, endOfMonth, set } from 'date-fns';

const StudentSchema = z.object({
    id: z.string(),
    parentId: z.string(),
    monthlyFee: z.number().optional(),
}).passthrough();

const ParentSchema = z.object({
    id: z.string(),
    userId: z.string(),
    preferredPaymentDay: z.number().optional(),
}).passthrough();

const InvoiceSchema = z.object({
    id: z.string(),
    studentId: z.string(),
    description: z.string(),
    dueDate: z.string(),
}).passthrough();

const GenerateMonthlyInvoicesInputSchema = z.object({
    students: z.array(StudentSchema),
    parents: z.array(ParentSchema),
    invoices: z.array(InvoiceSchema),
});
export type GenerateMonthlyInvoicesInput = z.infer<typeof GenerateMonthlyInvoicesInputSchema>;

// Define the shape of a new invoice to be created. It won't have an ID yet.
const NewInvoiceSchema = z.object({
    studentId: z.string(),
    parentUserId: z.string(),
    description: z.string(),
    amount: z.number(),
    dueDate: z.string(),
    status: z.literal('pending'),
});
export type NewInvoice = z.infer<typeof NewInvoiceSchema>;

const GenerateMonthlyInvoicesOutputSchema = z.object({
    invoicesToCreate: z.array(NewInvoiceSchema),
});
export type GenerateMonthlyInvoicesOutput = z.infer<typeof GenerateMonthlyInvoicesOutputSchema>;

// This is not an AI flow, but we use the ai.defineFlow structure
// to represent a callable server-side function.
const generateMonthlyInvoicesFlow = ai.defineFlow(
  {
    name: 'generateMonthlyInvoicesFlow',
    inputSchema: GenerateMonthlyInvoicesInputSchema,
    outputSchema: GenerateMonthlyInvoicesOutputSchema,
  },
  async (input) => {
    const { students, parents, invoices } = input;
    const invoicesToCreate: NewInvoice[] = [];

    const today = new Date();
    const currentMonthStart = startOfMonth(today);

    const studentParentMap = new Map(students.map(s => [s.id, s.parentId]));
    const parentDataMap = new Map(parents.map(p => [p.id, p]));
    
    students.forEach(student => {
        const parentId = studentParentMap.get(student.id);
        const parent = parentId ? parentDataMap.get(parentId) : null;

        if (!parent || !parent.userId) {
            // Cannot generate invoice without a parent and their auth ID
            return;
        }

        const hasInvoiceThisMonth = (invoices || []).some(inv => {
            const dueDate = new Date(inv.dueDate);
            return inv.studentId === student.id &&
                   inv.description === "Mensalidade Transporte" &&
                   dueDate >= currentMonthStart &&
                   dueDate <= endOfMonth(currentMonthStart);
        });

        if (!hasInvoiceThisMonth) {
            const paymentDay = parent.preferredPaymentDay || 10;
            // Ensure paymentDay is valid for the current month
            const lastDayOfMonth = endOfMonth(currentMonthStart).getDate();
            const validPaymentDay = Math.min(paymentDay, lastDayOfMonth);
            const dueDate = set(currentMonthStart, { date: validPaymentDay });

            const studentFee = student.monthlyFee || 450.00; // Default fee if not set

            invoicesToCreate.push({
                studentId: student.id,
                parentUserId: parent.userId,
                description: "Mensalidade Transporte",
                amount: studentFee,
                dueDate: format(dueDate, 'yyyy-MM-dd'),
                status: 'pending'
            });
        }
    });

    return { invoicesToCreate };
  }
);


// Export a wrapper function to be called from the client
export async function generateMonthlyInvoices(input: GenerateMonthlyInvoicesInput): Promise<GenerateMonthlyInvoicesOutput> {
  const result = await generateMonthlyInvoicesFlow(input);
  return result;
}
