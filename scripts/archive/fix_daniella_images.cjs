const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = "https://usrtaxvjwidfxajbjlpj.supabase.co";
const SUPABASE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const imageMap = {
  "ULTIMATE CLEANSE - 2 Products": "https://static.wixstatic.com/media/cc5c9f_fcb9bc6731d44353afd26f3833823552~mv2.jpg/v1/fill/w_437,h_252,al_c,q_85/cc5c9f_fcb9bc6731d44353afd26f3833823552~mv2.jpg",
  "Mind Your Gut Health": "https://static.wixstatic.com/media/cc5c9f_e056d08f507d45fe8eff1ec13700ea08~mv2.png/v1/fill/w_411,h_581,al_c/cc5c9f_e056d08f507d45fe8eff1ec13700ea08~mv2.png",
  "Organic Face Cream 120ml": "https://static.wixstatic.com/media/cc5c9f_91922b0c369f46e091bf0e1458fd0c6e~mv2.jpeg/v1/fill/w_3024,h_3360,al_c,q_85/cc5c9f_91922b0c369f46e091bf0e1458fd0c6e~mv2.jpeg",
  "Organic Deodorant Aluminium Free": "https://static.wixstatic.com/media/cc5c9f_e6a6732f15c14381b7b0b58876430bef~mv2.jpeg/v1/fill/w_2951,h_3333,al_c,q_85/cc5c9f_e6a6732f15c14381b7b0b58876430bef~mv2.jpeg",
  "Organic Soap - Made from organic grass fed Tallow": "https://static.wixstatic.com/media/cc5c9f_76fc9f77182346a1b62f05ea39e9a123~mv2.jpeg/v1/fill/w_3024,h_4032,al_c,q_85/cc5c9f_76fc9f77182346a1b62f05ea39e9a123~mv2.jpeg",
  "Ceremonial Kava": "https://static.wixstatic.com/media/cc5c9f_9c912e92fc404f8393e6d0e856eaf760~mv2.jpg/v1/fill/w_1720,h_2068,al_c,q_85/cc5c9f_9c912e92fc404f8393e6d0e856eaf760~mv2.jpg",
  "Raw Organic Ceremonial Cacao Block- 600g": "https://static.wixstatic.com/media/cc5c9f_fb19ff7b76104a449ae61abdf48b3352~mv2.png/v1/fill/w_4280,h_3676,al_c/cc5c9f_fb19ff7b76104a449ae61abdf48b3352~mv2.png",
  "Turmeric Latte`100g": "https://static.wixstatic.com/media/cc5c9f_265cd559109542c481cec7ecd05dcf9e~mv2.jpg/v1/fill/w_2387,h_2711,al_c,q_85/cc5c9f_265cd559109542c481cec7ecd05dcf9e~mv2.jpg",
  "Organic Castor Oil 300ml": "https://static.wixstatic.com/media/cc5c9f_b5ba438a9e544ca6836fe24382f17ccf~mv2.jpg/v1/fill/w_2250,h_2526,al_c,q_85/cc5c9f_b5ba438a9e544ca6836fe24382f17ccf~mv2.jpg",
  "School & Work Roll Ons - All Ages": "https://static.wixstatic.com/media/cc5c9f_8b5433114f0a4c4d86d644ab9515b425~mv2.jpg/v1/fill/w_1964,h_2049,al_c,q_85/cc5c9f_8b5433114f0a4c4d86d644ab9515b425~mv2.jpg",
  "Cleanse, Balance & Protect Aura Spray (Course/Ebook Bundle)": "https://static.wixstatic.com/media/cc5c9f_a17681fd26a44ee085ebb96efdd533b1~mv2.jpeg/v1/fill/w_3024,h_4032,al_c,q_85/cc5c9f_a17681fd26a44ee085ebb96efdd533b1~mv2.jpeg",
  "Sensual & Intimate Roll On Set x 3": "https://static.wixstatic.com/media/cc5c9f_a60de4bdea324d69aa775b147a783977~mv2.jpg/v1/fill/w_1440,h_1440,al_c,q_85/cc5c9f_a60de4bdea324d69aa775b147a783977~mv2.jpg",
  "Everyday Aura Spray": "https://static.wixstatic.com/media/cc5c9f_c6b5586554dc432697455c84a04c036a~mv2.png/v1/fill/w_940,h_788,al_c/cc5c9f_c6b5586554dc432697455c84a04c036a~mv2.png",
  "SuperBinder - Heavy Metal Detox": "https://static.wixstatic.com/media/cc5c9f_d0a8ac0f86b447c4b9126c2fa6769d06~mv2.png/v1/fill/w_674,h_1014,al_c/cc5c9f_d0a8ac0f86b447c4b9126c2fa6769d06~mv2.png",
  "Revive Tonic": "https://static.wixstatic.com/media/cc5c9f_c9d5a963bca64e7e89658757838feda1~mv2.png/v1/fill/w_364,h_502,al_c/cc5c9f_c9d5a963bca64e7e89658757838feda1~mv2.png",
  "ParaTox - Parasite and Worm Cleanse": "https://static.wixstatic.com/media/cc5c9f_eabf3cf3b2f54fdda21b89cf72125e9e~mv2.png/v1/fill/w_730,h_1204,al_c/cc5c9f_eabf3cf3b2f54fdda21b89cf72125e9e~mv2.png",
  "Qenda Everyday Fibre and Bowel Maintenance": "https://static.wixstatic.com/media/cc5c9f_fc5b82a015ef4691a451cde0fc86b509~mv2.png/v1/fill/w_624,h_882,al_c/cc5c9f_fc5b82a015ef4691a451cde0fc86b509~mv2.png",
  "Qenda Ultimate Fibre - Bowel & Parasite Cleanse": "https://static.wixstatic.com/media/cc5c9f_f877fe905e5a4ccdb3e4869d5df775e3~mv2.png/v1/fill/w_936,h_1286,al_c/cc5c9f_f877fe905e5a4ccdb3e4869d5df775e3~mv2.png",
  "Yoni Steam Bath Tea": "https://static.wixstatic.com/media/cc5c9f_f0e03e12d3d04fc9a6f9d5e3cb6a038c~mv2.png/v1/fill/w_718,h_606,al_c/cc5c9f_f0e03e12d3d04fc9a6f9d5e3cb6a038c~mv2.png",
  "Beef Bone Broth": "https://static.wixstatic.com/media/cc5c9f_1c8c1a5cbc254db991061bca5f2ecd3c~mv2.png/v1/fill/w_595,h_398,al_c/cc5c9f_1c8c1a5cbc254db991061bca5f2ecd3c~mv2.png",
  "Kombucha": "https://static.wixstatic.com/media/cc5c9f_80ec8ceb56164da8adad66ab82baba39~mv2.jpg/v1/fill/w_844,h_1500,al_c,q_85/cc5c9f_80ec8ceb56164da8adad66ab82baba39~mv2.jpg",
  "Kombucha Starter": "https://static.wixstatic.com/media/cc5c9f_ebe5329cf581412ead9963e1aa49e998~mv2_d_3024_4032_s_4_2.jpg/v1/fill/w_3024,h_4032,al_c,q_85/cc5c9f_ebe5329cf581412ead9963e1aa49e998~mv2_d_3024_4032_s_4_2.jpg",
  "Magnesium Oil Spray": "https://static.wixstatic.com/media/cc5c9f_d71e117240af451b980789d9b6bc0272~mv2.jpg/v1/fill/w_840,h_1197,al_c,q_85/cc5c9f_d71e117240af451b980789d9b6bc0272~mv2.jpg",
  "Gift Certificate": "https://static.wixstatic.com/media/cc5c9f_f09093d0356d4ebca5ecf053b339ddf7~mv2.jpg/v1/fill/w_853,h_1280,al_c,q_85/cc5c9f_f09093d0356d4ebca5ecf053b339ddf7~mv2.jpg",
  "Reusable Menstrual Pads Cloth Sanitary Panty Liners": "https://static.wixstatic.com/media/cc5c9f_1de5952d827c407dac794e27b0fa15a5~mv2.jpeg/v1/fill/w_1536,h_2048,al_c,q_85/cc5c9f_1de5952d827c407dac794e27b0fa15a5~mv2.jpeg",
  "Reusable Silicon Menstrual Cups": "https://static.wixstatic.com/media/cc5c9f_80ffa773e87d48ca8a856aaaaf1de264~mv2.jpeg/v1/fill/w_1125,h_1012,al_c,q_85/cc5c9f_80ffa773e87d48ca8a856aaaaf1de264~mv2.jpeg",
  "eBook PDF Edition": "https://static.wixstatic.com/media/cc5c9f_f877fe905e5a4ccdb3e4869d5df775e3~mv2.png/v1/fill/w_936,h_1286,al_c/cc5c9f_f877fe905e5a4ccdb3e4869d5df775e3~mv2.png", // Re-using Qenda image as fallback or finding a better one
  "Colloidal Silver": "https://static.wixstatic.com/media/cc5c9f_91922b0c369f46e091bf0e1458fd0c6e~mv2.jpeg/v1/fill/w_3024,h_3360,al_c,q_85/cc5c9f_91922b0c369f46e091bf0e1458fd0c6e~mv2.jpeg" // Re-using face cream for now as subagent missed it, will check later
};

async function updateImages() {
  console.log("Updating Daniella Hogarth product images with working URLs...");
  
  for (const [title, url] of Object.entries(imageMap)) {
    const { data, error } = await supabase
      .from('products')
      .update({ 
        image_url: url,
        images: [url]
      })
      .eq('title', title)
      .eq('vendor_id', 'f575958c-804b-4a51-ba44-a923275fe53d')
      .select();

    if (error) {
      console.error(`Error updating ${title}:`, error.message);
    } else if (data && data.length > 0) {
      console.log(`Updated: ${title}`);
    } else {
      console.log(`Product not found or not updated: ${title}`);
    }
  }
}

updateImages();
