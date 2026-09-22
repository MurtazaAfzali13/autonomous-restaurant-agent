export interface Meal {
  id: number;                // در زمان ایجاد ممکنه هنوز وجود نداشته باشه
  title: string;
  slug?: string;              // اگه سمت سرور تولید میشه، می‌تونه اختیاری باشه
  image: string;
  summary: string;
  instructions: string;
  creator: string;
  creator_email: string;
  price: number;
  category?: string;          // چون در فرم Update هم استفاده شده
}
