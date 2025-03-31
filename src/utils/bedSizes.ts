export interface Dimensions {
  width: number;
  length: number;
}

export interface BedSize {
  id: string;
  name: string;
  dimensions: Dimensions;
}

export const BED_SIZES: BedSize[] = [
  {
    id: 'single',
    name: 'Single Bed',
    dimensions: { width: 90, length: 190 }
  },
  {
    id: 'double',
    name: 'Double Bed',
    dimensions: { width: 135, length: 190 }
  },
  {
    id: 'queen',
    name: 'Queen Bed',
    dimensions: { width: 150, length: 200 }
  },
  {
    id: 'king',
    name: 'King Bed',
    dimensions: { width: 180, length: 200 }
  }
];

export const getBedSizeById = (id: string): BedSize => {
  const bedSize = BED_SIZES.find(size => size.id === id);
  if (!bedSize) {
    throw new Error(`Bed size with id "${id}" not found.`);
  }
  return bedSize;
};

export const getBedDisplayName = (bedSizeId: string): string => {
  try {
    return getBedSizeById(bedSizeId).name;
  } catch (e) {
    return bedSizeId;
  }
};
