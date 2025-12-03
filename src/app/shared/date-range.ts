export interface DateRange {
  start: string; // Formato YYYY-MM-DD para fácil consulta en Supabase
  end: string;
  type: 'preset' | 'custom';
}
