export const colors = {
  background: '#F8F5EF', // Seashell
  surface: '#FFFFFF',
  linen100: '#E9EBDD', // Light Sage Linen (Selected chip & progress)
  linen200: '#EDE6DA', // Warm Beige Linen (Cards & badges)
  snow100: '#FFFCF7', // Off-white card surface
  snow200: 'rgba(255, 252, 247, 0.91)', // Frosted badge surface
  text: {
    primary: '#242820', // Charcoal Gray
    secondary: '#727568', // Dim Gray
    accent: '#66704A', // Dark Olive Green
    muted: '#444A3B', // Dark Slate Gray
    inverse: '#FFFFFF',
  },
  primary: '#66704A',
  secondary: '#727568',
  border: '#DAD8CC', // Gainsboro fine divider
  white: '#FFFFFF',
} as const;

export type Colors = typeof colors;
