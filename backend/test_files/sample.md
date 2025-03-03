# 📄 Document Extraction for RAG Systems
> *Solving the challenge of extracting meaningful content from diverse file formats*

While building the Voxed app I stumbled upon a rather daunting task. I needed a way to ingest **hundreds of file types**, and embed their contents for RAG. However, this is easier said than done. Due to file diversity, most file types don't actually provide meaningful information in practice. 

For example, I tried to upload a PDF my teacher uploaded to canvas into one of my class notebooks on Voxed but the PDF didn't actually contain any OCR extractable text. Instead the text was in images. Along with that there where also diagrams and other visuals that needed to be handled. 

But enough rambling let's actually explore the solution...

---

## 🖼️ Embedded images

Often times (especially in education), documents have embedded visuals and diagrams making ingestion difficult.

### **Take these two pages from my CS444 lecture notes:**

<div align="center">

![nested image in pdf ex.1](https://aidanandrews22.github.io/content/images/extraction/img1.png)
*Here you can see there is nested text and image in the pdf.*

</div>

<div align="center">

![nested image in pdf ex.2](https://aidanandrews22.github.io/content/images/extraction/img2.png)
*Here there is just an image (with nested text).*

</div>

Now we need a way to meaningfully extract the contents of both. Its actually pretty easy if we use gemini vision (or equivalent). All we need to do is use fitz to extract both text and images then pass images to google vision. Like this:

```python
async def process_pdf_for_rag(file_content: bytes) -> str:
    """
    Extract text and image content from PDF for RAG systems using PyMuPDF and Gemini.
    
    Args:
        file_content: Raw PDF file content bytes
        
    Returns:
        str: Structured text content with image descriptions
    """
    try:
        # Open PDF document
        pdf_document = fitz.open(stream=file_content, filetype="pdf")
        
        full_text = []
        
        # Process each page
        for page_num in range(len(pdf_document)):
            page = pdf_document[page_num]
            
            # Extract text from page
            page_text = page.get_text()
            
            # Extract images with their positions
            image_info = await _extract_images_with_positions(page)
            
            # Combine text and processed images in proper sequence
            page_content = [f"[PAGE {page_num + 1}]"]
            
            if page_text.strip():
                page_content.append(page_text)
            
            # Process images with Gemini Vision API
            for img, _, _ in image_info:
                img_text = await _extract_text_and_description_from_image(img)
                if img_text:
                    page_content.append(f"[IMAGE CONTENT]\n{img_text}\n[/IMAGE CONTENT]")
            
            full_text.append("\n\n".join(page_content))
        
        pdf_document.close()
        return "\n\n".join(full_text)
    except Exception as e:
        logger.error(f"Error processing PDF file: {e}")
        raise
```

> ### ⚠️ Important Note
> Make sure you maintain the document ordering and structuring when extracting text

---

## 🔍 Example Output

<details>
<summary><b>Click to see the output (corresponding to page 1)</b></summary>

```
[IMAGE CONTENT START]
Extracted Text:
256-d
1x1, 64
relu
3x3, 64
relu
1x1, 256
+
relu

Image Description:
The image depicts a portion of a convolutional neural network (CNN) architecture.  It's a specific module, often part of a larger network.

Specifically, the image shows a **bottleneck layer** and a **residual connection**.

* **256-d:** This represents the input feature map dimension.  It's 256 channels likely of a certain spatial resolution. This means the input data has 256 different features represented at each point in the spatial dimension (width and height).


* **1x1, 64:** This represents a convolutional layer with a 1x1 kernel (a small matrix for convolution).  The kernel is applied across the input feature map, resulting in 64 new feature maps.  The 1x1 kernel size means it's not doing any spatial filtering, but rather a transformation or dimensionality reduction step.


* **relu:** This is the Rectified Linear Unit activation function.  It's applied element-wise to the output of the previous layer, introducing non-linearity into the network.


* **3x3, 64:** This is another convolutional layer with a 3x3 kernel, again transforming the feature maps into a new set. The size of the kernel is 3x3 implying it performs some spatial filtering.  Again, there are 64 output feature maps.


* **1x1, 256:** This final convolutional layer performs another transformation, now changing the number of feature maps back up to 256.


* **+:**  This signifies a **skip connection** or **residual connection**.  The output of this final layer is added to the input of the beginning of this block (the input, 256-d), bypassing several layers.  This is crucial for training very deep neural networks. It helps to avoid vanishing gradients.


* **relu:** The ReLU activation is applied to the summed result of the residual connection.

In summary, this image shows a sequence of convolutional layers with residual connections, commonly used in modern CNNs like ResNet.  It is a part of a larger network meant to classify images, recognizing objects, or some similar task. The layers are designed to extract increasingly complex features from the input image, and the residual connections help the network learn effectively with many layers.

[IMAGE CONTENT END]
[EXTRACTED TEXT]
ResNet
•
Directly performing 3×3 
convolutions with 256 feature maps 
at input and output: 
256×256×3×3 ≈ 600𝐾 operations
•
Using 1×1 convolutions to reduce 
256 to 64 feature maps, followed by 
3×3 convolutions, followed by 1×1 
convolutions to expand back to 256 
maps:
256×64×1×1 ≈ 16𝐾
64×64×3×3 ≈ 36𝐾
64×256×1×1 ≈ 16𝐾
Total ≈70𝐾
Deeper residual module 
(bottleneck)
K. He, X. Zhang, S. Ren, and J. Sun, Deep Residual Learning for Image 
Recognition, CVPR 2016 (Best Paper)
[EXTRACTED TEXT END]
```

</details>


---

## 💡 Key Takeaways

1. **Image extraction** is crucial for comprehensive document understanding
2. **Multi-modal processing** combines text and image analysis
3. **Proper structuring** maintains document context and relationships

---

<div align="center">
<h3>Want to learn more about document extraction?</h3>
<p>Check out the <a href="https://github.com/aidanandrews22/VoxAI">Voxed project on GitHub</a></p>
</div>

