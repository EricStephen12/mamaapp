export type RootStackParamList = {
  // 01 - Onboarding Group
  MamaKitchenSplash: undefined;

  // 02 - Auth Group
  MamaKitchenSignIn: undefined;
  MamaKitchenSignUp: undefined;

  // 03 - Personalization & Preferences Group
  MakeItYours: undefined;

  // 04 - Daily Edit (Home Feed) Group
  YourDailyEdit: undefined;

  // 05 - Discover Group
  DiscoverYourNextMeal: undefined;

  // 06 - Kitchen Scan Group
  WhatsInYourKitchen: undefined;

  // 07 - Pantry Review Group
  ConfirmYourPantry: undefined;

  // 08 - Kitchen Recipes Group
  AlreadyInYourKitchen: undefined;

  // 09 - Meal Details Group
  AtHomeMealDetails:
    | {
        id?: string;
        title?: string;
        subtitle?: string;
        cookTime?: string;
        gear?: string;
        estCost?: string;
        costNumeric?: number;
        image?: string;
        steps?: string[];
        ingredients?: { name: string; amount: string }[];
      }
    | undefined;
  EatingOutMealDetails:
    | {
        spotName?: string;
        dishName?: string;
        distance?: string;
        price?: string;
        vibe?: string;
        image?: string;
      }
    | undefined;

  // 10 - Collection Group
  YourCollection: undefined;
};
