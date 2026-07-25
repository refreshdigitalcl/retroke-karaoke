import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://koaayhnqgcyemnzkzffq.supabase.co'
const supabaseKey = 'sb_publishable_KsGg-AC8k4Jexmzvg9SYJw_W6eqo2i4'

export const supabase = createClient(supabaseUrl, supabaseKey)
