
async function main() {
    const url = 'http://localhost:4000/uploads/attachments/attachment-1769629612089-617045935.jpg';
    console.log('Fetching:', url);
    try {
        const res = await fetch(url);
        console.log('Status:', res.status, res.statusText);
        console.log('Headers:', res.headers);
        if (!res.ok) {
            console.log('Body:', await res.text());
        }
    } catch (error) {
        console.error('Fetch failed:', error);
    }
}

main();
