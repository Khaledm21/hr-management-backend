import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// We will read the mock files or write a clean seed generator
import { mockDepartments } from '../src/mocks/departments.js';
import { mockPositions } from '../src/mocks/positions.js';
import { mockEmployees } from '../src/mocks/employees.js';
import { mockSocialInsuranceRecords, mockMissingDocumentRecords } from '../src/mocks/insurance.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const seedData = {
  departments: mockDepartments,
  positions: mockPositions,
  employees: mockEmployees,
  socialInsurance: mockSocialInsuranceRecords,
  missingDocuments: mockMissingDocumentRecords,
};

fs.writeFileSync(
  path.join(__dirname, 'database', 'seed_data.json'),
  JSON.stringify(seedData, null, 2),
  'utf-8'
);

console.log('Successfully generated seed_data.json!');
