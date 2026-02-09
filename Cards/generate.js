const fs = require('fs');
const path = require('path');

const videosDir = './public/isl_videos/';
const outputFile = './public/isl_words_data.json';

try {
  // Read all video files
  const videoFiles = fs.readdirSync(videosDir)
    .filter(file => file.endsWith('.mp4'))
    .sort();

  console.log(`Found ${videoFiles.length} video files`);

  // Generate JSON entries for all videos
  const jsonData = videoFiles.map(filename => {
    // Remove .mp4 extension to get the word
    const wordName = filename.replace('.mp4', '');
    
    return {
      "word": wordName.toLowerCase(),
      "video_file": filename,
      "description": `ISL sign for ${wordName}`
    };
  });

  // Write to JSON file
  fs.writeFileSync(outputFile, JSON.stringify(jsonData, null, 2));

  console.log(`✅ Successfully generated ${jsonData.length} entries`);
  console.log(`📁 Output saved to: ${outputFile}`);
  console.log(`🎯 All ${videoFiles.length} videos are now searchable!`);
  
  // Show first 5 entries as sample
  console.log('\n📋 Sample entries:');
  jsonData.slice(0, 5).forEach((entry, index) => {
    console.log(`${index + 1}. "${entry.word}" -> ${entry.video_file}`);
  });

} catch (error) {
  console.error('❌ Error generating JSON:', error);
}