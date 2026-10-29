export type MealPeriod = 'morning' | 'lunch' | 'dinner' | 'late_night';
export type EnergyLevel = 'survival' | 'one_pan' | 'takeout';

export interface CatalogMeal {
  id: string;
  title: string;
  subtitle: string;
  cookTime: string;
  gear: string;
  dishesCount: number;
  estCost: string;
  image: string;
  tags: string[];
  steps: string[];
}

export interface TakeoutSpot {
  name: string;
  dish: string;
  distance: string;
  price: string;
  image: string;
  vibe: string;
}

// 24/7 Meals mapped by [Time of Day] -> [Cuisine]
export const MEAL_CATALOG: Record<
  MealPeriod,
  Record<string, { standard: CatalogMeal; survival: CatalogMeal; takeout: TakeoutSpot }>
> = {
  morning: {
    african_caribbean: {
      standard: {
        id: 'af-morn-std',
        title: 'Sizzled Pepper Eggs & Crusty Bread',
        subtitle: 'Velvety eggs cooked in sliced peppers and sweet onions.',
        cookTime: '7 min',
        gear: '1 Skillet',
        dishesCount: 1,
        estCost: '$1.70',
        image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80',
        tags: ['High Protein', '1-Pan', 'Warm Heat'],
        steps: [
          'Sear sliced onions and peppers in hot oil for 2 minutes.',
          'Pour in beaten eggs and pinch of salt; gently fold into loose curds.',
          'Serve steaming hot with warm sliced crusty bread.',
        ],
      },
      survival: {
        id: 'af-morn-surv',
        title: '4-Min Buttered Chili Egg Toast',
        subtitle: 'Golden toast pressed into a hot skillet with fried eggs.',
        cookTime: '4 min',
        gear: '1 Pan',
        dishesCount: 1,
        estCost: '$1.10',
        image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80',
        tags: ['Zero Effort', 'Quick Rush'],
        steps: [
          'Butter both sides of bread and toast in pan until golden.',
          'Fry one egg with pepper directly beside the bread.',
          'Slap egg onto toast and go!',
        ],
      },
      takeout: {
        name: 'Mama Boma Kitchen',
        dish: 'Warm Akara & Soft Agege Bread',
        distance: '0.3 mi away',
        price: '$5.50',
        image: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=400&q=80',
        vibe: 'Freshly fried, piping hot, zero wait',
      },
    },
    asian_comfort: {
      standard: {
        id: 'as-morn-std',
        title: 'Crispy Garlic Fried Egg Rice',
        subtitle: 'Golden sizzled egg over warm rice with sesame and scallions.',
        cookTime: '6 min',
        gear: '1 Pan',
        dishesCount: 1,
        estCost: '$1.40',
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
        tags: ['Fragrant', 'Pantry Staple'],
        steps: [
          'Crisp minced garlic in sesame oil until fragrant (1 min).',
          'Add warm rice, toss to coat in hot oil.',
          'Crack egg in the center, cover for 2 minutes and serve.',
        ],
      },
      survival: {
        id: 'as-morn-surv',
        title: '3-Min Scallion Scrambled Toast',
        subtitle: 'Quick beaten eggs with sliced scallions on crisp bread.',
        cookTime: '3 min',
        gear: '1 Pan',
        dishesCount: 1,
        estCost: '$1.20',
        image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80',
        tags: ['Ultra Fast', 'High Protein'],
        steps: [
          'Toast bread in pan.',
          'Pour whisked eggs with scallions, swirl 45 seconds.',
          'Spoon over toast.',
        ],
      },
      takeout: {
        name: 'Little Bao Cafe',
        dish: 'Steamed Pork Bao & Soy Milk',
        distance: '0.4 mi away',
        price: '$6.00',
        image: 'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?auto=format&fit=crop&w=400&q=80',
        vibe: 'Warm morning counter',
      },
    },
    default: {
      standard: {
        id: 'def-morn-std',
        title: 'Golden Garlic Butter Eggs & Toast',
        subtitle: 'Soft runny eggs with crispy butter-fried sourdough.',
        cookTime: '6 min',
        gear: '1 Skillet',
        dishesCount: 1,
        estCost: '$1.50',
        image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80',
        tags: ['1-Pan', 'Comfort Classic'],
        steps: [
          'Melt butter with garlic in skillet on medium heat.',
          'Crack 2 eggs into pan; toast bread alongside.',
          'Season with sea salt & pepper, slide onto plate.',
        ],
      },
      survival: {
        id: 'def-morn-surv',
        title: '3-Min Cheesy Egg Cup',
        subtitle: 'Whisked egg and cheese steamed hot in under 3 minutes.',
        cookTime: '3 min',
        gear: 'Mug or Pan',
        dishesCount: 1,
        estCost: '$0.90',
        image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80',
        tags: ['Zero Pan', 'Rush Fuel'],
        steps: [
          'Whisk egg with a splash of milk and cheese.',
          'Microwave for 90 seconds or swirl in hot pan.',
          'Eat piping hot with black pepper.',
        ],
      },
      takeout: {
        name: 'Corner Bakery & Espresso',
        dish: 'Egg & Cheddar Brioche Roll',
        distance: '0.2 mi away',
        price: '$5.80',
        image: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=400&q=80',
        vibe: 'Quick pickup on the way',
      },
    },
  },

  lunch: {
    african_caribbean: {
      standard: {
        id: 'af-lunch-std',
        title: '10-Min Jollof Fried Rice Skillet',
        subtitle: 'Spiced tomato fried rice with sweet onions and eggs.',
        cookTime: '10 min',
        gear: '1 Pan',
        dishesCount: 1,
        estCost: '$2.10',
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
        tags: ['Midday Power', 'Satisfying'],
        steps: [
          'Fry tomato puree and onions in oil with curry powder (2 mins).',
          'Toss in cooked rice until every grain turns rich reddish-orange.',
          'Top with sunny fried eggs and sliced green onions.',
        ],
      },
      survival: {
        id: 'af-lunch-surv',
        title: '5-Min Spicy Egg & Sardine Toast',
        subtitle: 'Savory mashed sardines and fried eggs over crusty bread.',
        cookTime: '5 min',
        gear: '1 Pan',
        dishesCount: 1,
        estCost: '$1.80',
        image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80',
        tags: ['High Energy', 'Fast'],
        steps: [
          'Toast bread in pan.',
          'Warm sardines with chili and onions, slide onto toast.',
          'Top with hot fried egg.',
        ],
      },
      takeout: {
        name: 'Suya Spot & Bowls',
        dish: 'Spiced Chicken Bowl with Plantains',
        distance: '0.5 mi away',
        price: '$11.00',
        image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80',
        vibe: 'Hearty midday refuel',
      },
    },
    asian_comfort: {
      standard: {
        id: 'as-lunch-std',
        title: '10-Min Garlic Sesame Noodles',
        subtitle: 'Tossed springy noodles with dark soy, chili oil, and egg.',
        cookTime: '9 min',
        gear: '1 Pot or Pan',
        dishesCount: 1,
        estCost: '$1.80',
        image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80',
        tags: ['Light & Fast', 'No Slump'],
        steps: [
          'Boil noodles for 3 minutes and drain.',
          'Sizzle minced garlic and chili flakes in sesame oil (45 seconds).',
          'Toss noodles in the oil with soy sauce and a 6-minute boiled egg.',
        ],
      },
      survival: {
        id: 'as-lunch-surv',
        title: '5-Min Egg Fried Rice',
        subtitle: 'Leftover rice tossed with loose curds and soy sauce.',
        cookTime: '5 min',
        gear: '1 Skillet',
        dishesCount: 1,
        estCost: '$1.30',
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
        tags: ['Leftover Lifesaver', 'Comfort'],
        steps: [
          'Scramble eggs in hot oil for 30 seconds.',
          'Add cold cooked rice, break apart, splash with soy sauce.',
          'Toss 2 minutes and serve.',
        ],
      },
      takeout: {
        name: 'Tokyo Express Noodle',
        dish: 'Chicken Teriyaki Rice Bowl',
        distance: '0.3 mi away',
        price: '$9.50',
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
        vibe: 'Quick counter pickup',
      },
    },
    default: {
      standard: {
        id: 'def-lunch-std',
        title: 'Crispy Garlic Tomato Pasta',
        subtitle: 'Light spaghetti tossed in hot garlic oil and blistered tomatoes.',
        cookTime: '11 min',
        gear: '1 Pan',
        dishesCount: 1,
        estCost: '$2.00',
        image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80',
        tags: ['1-Pan', 'Light Lunch'],
        steps: [
          'Cook pasta in salted water.',
          'In skillet, burst cherry tomatoes in hot olive oil with garlic.',
          'Toss pasta into the tomato oil with a handful of cheese.',
        ],
      },
      survival: {
        id: 'def-lunch-surv',
        title: '4-Min Golden Grilled Cheese',
        subtitle: 'Crisped bread oozing melted cheddar with hot sauce.',
        cookTime: '4 min',
        gear: '1 Pan',
        dishesCount: 1,
        estCost: '$1.20',
        image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80',
        tags: ['Pure Comfort', 'Fast'],
        steps: [
          'Butter bread slices, sandwich generous cheese inside.',
          'Grill 2 minutes per side until golden brown and melted.',
        ],
      },
      takeout: {
        name: 'Green & Grain Deli',
        dish: 'Warm Mediterranean Wrap',
        distance: '0.2 mi away',
        price: '$8.90',
        image: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=400&q=80',
        vibe: 'Healthy and quick',
      },
    },
  },

  dinner: {
    african_caribbean: {
      standard: {
        id: 'af-din-std',
        title: 'Sizzled Pepper Egg & Onion Skillet',
        subtitle: 'Spicy rich tomato reduction folded with eggs over warm rice.',
        cookTime: '9 min',
        gear: '1 Skillet',
        dishesCount: 1,
        estCost: '$2.20',
        image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80',
        tags: ['High Comfort', '1-Pan', 'Proper Pepper'],
        steps: [
          'Simmer diced tomatoes, onions, and scotch bonnet peppers in oil (4 mins).',
          'Whisk 3 eggs with sea salt and pour into the bubbling sauce.',
          'Fold into thick curds, take off heat while still velvety, eat with rice.',
        ],
      },
      survival: {
        id: 'af-din-surv',
        title: '6-Min Fried Plantain & Sunny Eggs',
        subtitle: 'Sweet golden plantains sizzled with crispy-edged fried eggs.',
        cookTime: '6 min',
        gear: '1 Pan',
        dishesCount: 1,
        estCost: '$2.00',
        image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
        tags: ['Sweet & Savory', 'Bachelor Favorite'],
        steps: [
          'Slice ripe plantains into coins, fry in oil until golden brown (3 mins).',
          'Push plantains to edge of pan, crack eggs into center.',
          'Season with pepper, slide entire skillet onto plate.',
        ],
      },
      takeout: {
        name: 'Enugu Grill & Stews',
        dish: 'Smoked Jollof with Peppered Chicken',
        distance: '0.6 mi away',
        price: '$13.50',
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
        vibe: 'Warm timber counter, quiet jazz',
      },
    },
    asian_comfort: {
      standard: {
        id: 'as-din-std',
        title: 'Silky Tomato Egg Stir-Fry',
        subtitle: 'Tender vine tomatoes broken down into savory sauce with soft eggs.',
        cookTime: '10 min',
        gear: '1 Skillet',
        dishesCount: 1,
        estCost: '$1.90',
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
        tags: ['Chinese Classic', 'Zero Mental Load'],
        steps: [
          'Sear whisked eggs in hot oil for 40 seconds; set aside runny.',
          'Cook chopped tomatoes with a splash of water and pinch of sugar until saucy (4 mins).',
          'Fold eggs back in, scatter sliced scallions, spoon over rice.',
        ],
      },
      survival: {
        id: 'as-din-surv',
        title: '5-Min Butter Soy Garlic Rice',
        subtitle: 'Hot rice tossed in browned butter, soy sauce, and crispy egg.',
        cookTime: '5 min',
        gear: '1 Pan',
        dishesCount: 1,
        estCost: '$1.40',
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
        tags: ['Comfort Fuel', 'Pantry Friendly'],
        steps: [
          'Melt 1 tbsp butter in pan until nutty and sizzling.',
          'Crack egg in center, crisp the bottom.',
          'Pour 1 tsp soy sauce over hot rice and top with the buttery egg.',
        ],
      },
      takeout: {
        name: 'Koyo Izakaya & Bowls',
        dish: 'Smoked Garlic Paitan Ramen',
        distance: '0.4 mi away',
        price: '$12.00',
        image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=400&q=80',
        vibe: 'Steaming broth, zero wait',
      },
    },
    default: {
      standard: {
        id: 'def-din-std',
        title: 'Stovetop Shakshuka with Crusty Bread',
        subtitle: 'Rich simmered tomatoes, garlic, and soft poached eggs.',
        cookTime: '11 min',
        gear: '1 Pan',
        dishesCount: 1,
        estCost: '$2.30',
        image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80',
        tags: ['1-Pan', 'Comforting'],
        steps: [
          'Cook tomatoes and garlic with olive oil until saucy.',
          'Make 2 wells in the sauce, crack eggs directly in.',
          'Cover with lid for 3 minutes until whites set and yolks remain runny.',
        ],
      },
      survival: {
        id: 'def-din-surv',
        title: '6-Min Garlic Butter Cheesy Toast',
        subtitle: 'Sizzled bread with melted cheese and runny fried egg.',
        cookTime: '6 min',
        gear: '1 Pan',
        dishesCount: 1,
        estCost: '$1.50',
        image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80',
        tags: ['Low Effort', 'Warm'],
        steps: [
          'Toast bread in garlic butter.',
          'Top with cheese, fry egg beside it, slide egg on top.',
        ],
      },
      takeout: {
        name: 'Little Olive Trattoria',
        dish: 'Garlic Penne & Sourdough',
        distance: '0.4 mi away',
        price: '$11.50',
        image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=400&q=80',
        vibe: 'Quiet neighborhood gem',
      },
    },
  },

  late_night: {
    african_caribbean: {
      standard: {
        id: 'af-late-std',
        title: '4-Min Midnight Pepper Bread Melt',
        subtitle: 'Crusty bread toasted with scotch bonnet butter and melted cheese.',
        cookTime: '4 min',
        gear: '1 Pan',
        dishesCount: 1,
        estCost: '$1.40',
        image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80',
        tags: ['Late Night', 'Spicy'],
        steps: [
          'Butter bread with pinch of chili powder.',
          'Toast in skillet until golden and melted.',
        ],
      },
      survival: {
        id: 'af-late-surv',
        title: '3-Min Scrambled Pepper Mug',
        subtitle: 'Eggs whisked with black pepper, hot in 3 minutes.',
        cookTime: '3 min',
        gear: '1 Pan or Mug',
        dishesCount: 1,
        estCost: '$0.80',
        image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80',
        tags: ['Zero Pan', 'Instant'],
        steps: ['Whisk eggs with pepper, swirl in hot pan for 60 seconds.'],
      },
      takeout: {
        name: 'Midnight Express Grill',
        dish: 'Spicy Grilled Beef Suya Skewer',
        distance: '0.3 mi away',
        price: '$7.00',
        image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80',
        vibe: 'Open late, hot off the coals',
      },
    },
    asian_comfort: {
      standard: {
        id: 'as-late-std',
        title: '4-Min Upgraded Chili Garlic Ramen',
        subtitle: 'Springy noodles simmered with a poached egg and sesame oil.',
        cookTime: '4 min',
        gear: '1 Small Pot',
        dishesCount: 1,
        estCost: '$1.50',
        image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80',
        tags: ['Late Night Fuel', 'Cozy'],
        steps: [
          'Boil noodles in 1 cup water with seasoning.',
          'Crack egg directly into broth during last 90 seconds.',
          'Drizzle sesame oil and eat right from the pot.',
        ],
      },
      survival: {
        id: 'as-late-surv',
        title: '3-Min Soy Butter Rice with Egg',
        subtitle: 'Warm rice with raw egg yolk and hot soy butter sauce.',
        cookTime: '3 min',
        gear: '1 Bowl',
        dishesCount: 1,
        estCost: '$0.90',
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
        tags: ['Japanese Comfort', 'Zero Cooking'],
        steps: [
          'Warm up leftover rice.',
          'Drop egg in center, drizzle hot melted butter and soy sauce.',
          'Stir vigorously until creamy and velvety.',
        ],
      },
      takeout: {
        name: 'Late Night Dumpling House',
        dish: 'Steamed Pork Dumplings (6 pcs)',
        distance: '0.4 mi away',
        price: '$7.50',
        image: 'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?auto=format&fit=crop&w=400&q=80',
        vibe: 'Open until 2 AM',
      },
    },
    default: {
      standard: {
        id: 'def-late-std',
        title: '4-Min Midnight Grilled Cheese',
        subtitle: 'Crispy buttered toast with gooey cheddar and black pepper.',
        cookTime: '4 min',
        gear: '1 Pan',
        dishesCount: 1,
        estCost: '$1.20',
        image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80',
        tags: ['Midnight Lifesaver', 'Comfort'],
        steps: [
          'Slap bread and cheese into hot buttered pan.',
          'Flip after 2 minutes until golden brown and melted.',
        ],
      },
      survival: {
        id: 'def-late-surv',
        title: '3-Min Butter Fried Egg',
        subtitle: '2 crispy eggs with cracked pepper eaten off the plate.',
        cookTime: '3 min',
        gear: '1 Pan',
        dishesCount: 1,
        estCost: '$0.90',
        image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80',
        tags: ['Pure Protein', 'Fast'],
        steps: ['Fry eggs in butter for 2 minutes and devour.'],
      },
      takeout: {
        name: '24/7 Corner Diner',
        dish: 'Loaded Fries with Melted Cheddar',
        distance: '0.3 mi away',
        price: '$6.50',
        image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80',
        vibe: 'Always open, zero judgment',
      },
    },
  },
};
