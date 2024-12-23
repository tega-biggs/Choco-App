import { db } from "@/lib/db/db";
import { products } from "@/lib/db/schema";
import { productSchema } from "@/lib/validators/productSchema";
import { writeFile } from "node:fs/promises";
import path from "node:path";

export async function POST(request: Request) {
    const data = await request.formData();

    let validatedData;
    try {
        validatedData = productSchema.parse({
            name: data.get('name'),
            description: data.get('description'),
            price: Number(data.get('price')),
            image: data.get('image'),
        });
    } catch (err) {
        return Response.json({ message:err }, { status: 400});
    }

    const filename = `${Date.now()}.${validatedData.image.name.split('.').slice(-1)}`;// choco.png 213123123123.png

    try {
        const buffer = Buffer.from(await validatedData.image.arrayBuffer());
        await writeFile(path.join(process.cwd(), "public/assets", filename), buffer)
    } catch (err) {
        console.error('File saving error:', err); // Log the error
        return new Response(
            JSON.stringify({ message: 'failed to save the file to fs'}), 
            { status: 500}
        );
    }

    try {
        await db.insert(products).values({ ...validatedData, image: filename })
    } catch (err) {
        console.error('Database error:', err); // log the error
        // remove stored image from fs
        return new Response(
            JSON.stringify({ message: 'failed to store product into the database'}), 
            {status: 500}
        );
    }

    return Response.json({ message: 'Product created successfully' }, { status: 201 });
}