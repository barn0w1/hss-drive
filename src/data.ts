
export interface Space {
  id: string;
  name: string;
  color: string;
}

export type EntryType = 'file' | 'dir';

export interface Entry {
  path: string; // Full path e.g., "Documents/Resume.pdf"
  name: string; // Display name e.g., "Resume.pdf"
  type: EntryType;
  size?: number; // Size in bytes
  updatedAt: string;
}

export const spaces: Space[] = [
  { id: 'personal', name: 'Personal', color: 'text-blue-500' },
  { id: 'work', name: 'Work', color: 'text-purple-500' },
  { id: 'archive', name: 'Archive', color: 'text-gray-500' },
];

/**
 * Helper to create directory entries implicitly or explicitly.
 * For this dummy data, we will list flat entries and the UI will 
 * need to handle filtering by prefix.
 * 
 * However, to match the "Drive" feel, we usually want explicit folders.
 * We will assume a flat list of ALL objects (files and folders) per space.
 */
export const entries: Record<string, Entry[]> = {
  personal: [
    { path: 'Documents', name: 'Documents', type: 'dir', updatedAt: '2023-10-24' },
    { path: 'Documents/Resume.pdf', name: 'Resume.pdf', type: 'file', size: 1200000, updatedAt: '2023-10-01' },
    { path: 'Documents/Budget.xlsx', name: 'Budget.xlsx', type: 'file', size: 24000, updatedAt: '2023-10-02' },
    { path: 'Documents/Notes.txt', name: 'Notes.txt', type: 'file', size: 1024, updatedAt: '2023-10-03' },
    
    { path: 'Images', name: 'Images', type: 'dir', updatedAt: '2023-10-25' },
    { path: 'Images/Vacation', name: 'Vacation', type: 'dir', updatedAt: '2023-09-15' },
    { path: 'Images/Vacation/Beach.jpg', name: 'Beach.jpg', type: 'file', size: 3100000, updatedAt: '2023-09-15' },
    { path: 'Images/Vacation/Mountain.jpg', name: 'Mountain.jpg', type: 'file', size: 4500000, updatedAt: '2023-09-16' },
    { path: 'Images/Profile.png', name: 'Profile.png', type: 'file', size: 2400000, updatedAt: '2023-09-20' },
  ],
  work: [
    { path: 'Projects', name: 'Projects', type: 'dir', updatedAt: '2023-11-01' },
    { path: 'Projects/Website Redesign', name: 'Website Redesign', type: 'dir', updatedAt: '2023-11-05' },
    { path: 'Projects/Website Redesign/Specs.pdf', name: 'Specs.pdf', type: 'file', size: 1500000, updatedAt: '2023-11-01' },
    { path: 'Projects/Website Redesign/mockups.fig', name: 'mockups.fig', type: 'file', size: 12000000, updatedAt: '2023-11-01' },
    
    { path: 'Projects/Mobile App', name: 'Mobile App', type: 'dir', updatedAt: '2023-11-06' },
    
    { path: 'Finances', name: 'Finances', type: 'dir', updatedAt: '2023-11-02' },
    { path: 'Report.docx', name: 'Report.docx', type: 'file', size: 500000, updatedAt: '2023-11-03' },
  ],
  archive: [
    { path: 'Old Photos', name: 'Old Photos', type: 'dir', updatedAt: '2020-01-01' },
  ]
};

