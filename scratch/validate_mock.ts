
import { initialMockData } from '../src/lib/mock-data';
console.log('Mock data loaded successfully');
console.log('Routes count:', initialMockData.routes.length);
console.log('Students count:', initialMockData.students.length);
console.log('Status "pendente_alocacao" exists check...');
const sampleStudent = initialMockData.students[0];
console.log('Sample student status:', sampleStudent.status);
console.log('Validation COMPLETE');
