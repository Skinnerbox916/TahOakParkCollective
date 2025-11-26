async function testTags() {
  try {
    const res = await fetch('http://localhost:3000/api/tags');
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Tags count:', data.data?.length);
    if (data.data?.length > 0) {
        console.log('First 3 tags:', data.data.slice(0, 3));
    }
  } catch (e) {
    console.error('Error:', e);
  }
}

testTags();


