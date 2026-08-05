export type Network = 'MTN' | 'Airtel' | 'Glo' | '9mobile' | 'Unknown'

export function detectNetwork(phone: string): Network {
  // Remove non-numeric characters
  let p = phone.replace(/\D/g, '')
  
  // Convert +234 or 234 format to 0 format
  if (p.startsWith('234') && p.length >= 13) {
    p = '0' + p.substring(3)
  }

  if (p.length < 4) return 'Unknown'
  
  const prefix = p.substring(0, 4)
  
  if (['0803','0806','0703','0903','0906','0810','0813','0814','0816','0913','0916'].includes(prefix)) return 'MTN'
  if (['0802','0808','0708','0812','0701','0902','0901','0907','0912','0911'].includes(prefix)) return 'Airtel'
  if (['0805','0807','0705','0815','0811','0905','0915'].includes(prefix)) return 'Glo'
  if (['0809','0817','0818','0909','0908'].includes(prefix)) return '9mobile'
  
  return 'Unknown'
}

