export interface SampleRecord {
  Date: string;
  Product: string;
  Category: string;
  Region: string;
  Customer: string;
  Quantity: number;
  Revenue: number;
  Cost: number;
  Profit: number;
}

export const SAMPLE_SALES_DATA: SampleRecord[] = [
  { Date: "2024-01-05", Product: "Enterprise Cloud Suite", Category: "Software", Region: "Lagos", Customer: "Apex Zenith Corp", Quantity: 4, Revenue: 1200000, Cost: 480000, Profit: 720000 },
  { Date: "2024-01-08", Product: "Analytics Pro License", Category: "Software", Region: "Abuja", Customer: "First Horizon Ltd", Quantity: 10, Revenue: 650000, Cost: 260000, Profit: 390000 },
  { Date: "2024-01-12", Product: "Security Gateway Appliance", Category: "Hardware", Region: "Port Harcourt", Customer: "Delta Stream Oil", Quantity: 2, Revenue: 950000, Cost: 620000, Profit: 330000 },
  { Date: "2024-01-15", Product: "Cloud Backup Vault", Category: "Services", Region: "Lagos", Customer: "Sterling Prime Logistics", Quantity: 15, Revenue: 450000, Cost: 180000, Profit: 270000 },
  { Date: "2024-01-20", Product: "Database High-Availability", Category: "Software", Region: "Kano", Customer: "Savanna Trade Network", Quantity: 5, Revenue: 820000, Cost: 330000, Profit: 490000 },
  { Date: "2024-01-25", Product: "Enterprise Cloud Suite", Category: "Software", Region: "Abuja", Customer: "Federal Capital Finance", Quantity: 8, Revenue: 2400000, Cost: 960000, Profit: 1440000 },
  { Date: "2024-01-29", Product: "Managed Support Tier 1", Category: "Services", Region: "Ibadan", Customer: "Oyo Agro Solutions", Quantity: 12, Revenue: 360000, Cost: 120000, Profit: 240000 },

  { Date: "2024-02-03", Product: "AI Workflow Assistant", Category: "Software", Region: "Lagos", Customer: "BlueWave Tech Labs", Quantity: 20, Revenue: 1500000, Cost: 450000, Profit: 1050000 },
  { Date: "2024-02-07", Product: "Security Gateway Appliance", Category: "Hardware", Region: "Lagos", Customer: "Eko Atlantic Commerce", Quantity: 3, Revenue: 1425000, Cost: 930000, Profit: 495000 },
  { Date: "2024-02-11", Product: "Analytics Pro License", Category: "Software", Region: "Port Harcourt", Customer: "Gulf Marine Services", Quantity: 6, Revenue: 390000, Cost: 156000, Profit: 234000 },
  { Date: "2024-02-16", Product: "Cloud Backup Vault", Category: "Services", Region: "Abuja", Customer: "Unity Capital Partners", Quantity: 25, Revenue: 750000, Cost: 300000, Profit: 450000 },
  { Date: "2024-02-21", Product: "Enterprise Cloud Suite", Category: "Software", Region: "Kano", Customer: "Arewa Agro Group", Quantity: 3, Revenue: 900000, Cost: 360000, Profit: 540000 },
  { Date: "2024-02-26", Product: "AI Workflow Assistant", Category: "Software", Region: "Lagos", Customer: "PayDirect Systems", Quantity: 14, Revenue: 1050000, Cost: 315000, Profit: 735000 },

  { Date: "2024-03-02", Product: "Enterprise Cloud Suite", Category: "Software", Region: "Lagos", Customer: "Apex Zenith Corp", Quantity: 6, Revenue: 1800000, Cost: 720000, Profit: 1080000 },
  { Date: "2024-03-06", Product: "Database High-Availability", Category: "Software", Region: "Abuja", Customer: "Federal Capital Finance", Quantity: 7, Revenue: 1148000, Cost: 462000, Profit: 686000 },
  { Date: "2024-03-10", Product: "Security Gateway Appliance", Category: "Hardware", Region: "Abuja", Customer: "Nexus Defense Systems", Quantity: 5, Revenue: 2375000, Cost: 1550000, Profit: 825000 },
  { Date: "2024-03-14", Product: "Managed Support Tier 1", Category: "Services", Region: "Lagos", Customer: "Mainland Health Network", Quantity: 18, Revenue: 540000, Cost: 180000, Profit: 360000 },
  { Date: "2024-03-18", Product: "Analytics Pro License", Category: "Software", Region: "Port Harcourt", Customer: "Niger Basin Energy", Quantity: 12, Revenue: 780000, Cost: 312000, Profit: 468000 },
  { Date: "2024-03-23", Product: "AI Workflow Assistant", Category: "Software", Region: "Lagos", Customer: "VentureScale Africa", Quantity: 22, Revenue: 1650000, Cost: 495000, Profit: 1155000 },
  { Date: "2024-03-28", Product: "Cloud Backup Vault", Category: "Services", Region: "Ibadan", Customer: "Horizon Mills Nigeria", Quantity: 8, Revenue: 240000, Cost: 96000, Profit: 144000 },

  { Date: "2024-04-04", Product: "Enterprise Cloud Suite", Category: "Software", Region: "Port Harcourt", Customer: "Delta Stream Oil", Quantity: 5, Revenue: 1500000, Cost: 600000, Profit: 900000 },
  { Date: "2024-04-09", Product: "Security Gateway Appliance", Category: "Hardware", Region: "Lagos", Customer: "Sterling Prime Logistics", Quantity: 4, Revenue: 1900000, Cost: 1240000, Profit: 660000 },
  { Date: "2024-04-15", Product: "Database High-Availability", Category: "Software", Region: "Lagos", Customer: "BlueWave Tech Labs", Quantity: 4, Revenue: 656000, Cost: 264000, Profit: 392000 },
  { Date: "2024-04-21", Product: "AI Workflow Assistant", Category: "Software", Region: "Abuja", Customer: "Unity Capital Partners", Quantity: 16, Revenue: 1200000, Cost: 360000, Profit: 840000 },
  { Date: "2024-04-27", Product: "Analytics Pro License", Category: "Software", Region: "Kano", Customer: "Savanna Trade Network", Quantity: 9, Revenue: 585000, Cost: 234000, Profit: 351000 },

  { Date: "2024-05-03", Product: "Enterprise Cloud Suite", Category: "Software", Region: "Lagos", Customer: "PayDirect Systems", Quantity: 7, Revenue: 2100000, Cost: 840000, Profit: 1260000 },
  { Date: "2024-05-09", Product: "AI Workflow Assistant", Category: "Software", Region: "Port Harcourt", Customer: "Gulf Marine Services", Quantity: 18, Revenue: 1350000, Cost: 405000, Profit: 945000 },
  { Date: "2024-05-14", Product: "Security Gateway Appliance", Category: "Hardware", Region: "Kano", Customer: "Arewa Agro Group", Quantity: 2, Revenue: 950000, Cost: 620000, Profit: 330000 },
  { Date: "2024-05-19", Product: "Managed Support Tier 1", Category: "Services", Region: "Abuja", Customer: "Federal Capital Finance", Quantity: 20, Revenue: 600000, Cost: 200000, Profit: 400000 },
  { Date: "2024-05-26", Product: "Cloud Backup Vault", Category: "Services", Region: "Lagos", Customer: "Apex Zenith Corp", Quantity: 30, Revenue: 900000, Cost: 360000, Profit: 540000 },

  { Date: "2024-06-02", Product: "Database High-Availability", Category: "Software", Region: "Port Harcourt", Customer: "Delta Stream Oil", Quantity: 6, Revenue: 984000, Cost: 396000, Profit: 588000 },
  { Date: "2024-06-07", Product: "Enterprise Cloud Suite", Category: "Software", Region: "Abuja", Customer: "Nexus Defense Systems", Quantity: 10, Revenue: 3000000, Cost: 1200000, Profit: 1800000 },
  { Date: "2024-06-12", Product: "AI Workflow Assistant", Category: "Software", Region: "Lagos", Customer: "VentureScale Africa", Quantity: 25, Revenue: 1875000, Cost: 562500, Profit: 1312500 },
  { Date: "2024-06-18", Product: "Analytics Pro License", Category: "Software", Region: "Lagos", Customer: "Eko Atlantic Commerce", Quantity: 14, Revenue: 910000, Cost: 364000, Profit: 546000 },
  { Date: "2024-06-25", Product: "Security Gateway Appliance", Category: "Hardware", Region: "Ibadan", Customer: "Horizon Mills Nigeria", Quantity: 3, Revenue: 1425000, Cost: 930000, Profit: 495000 }
];
