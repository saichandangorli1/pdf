import React, { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import { useDropzone } from "react-dropzone";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import { encrypt } from "./utils/encryption";
import "./App.css";

const App = () => {
  const [images, setImages] = useState([]);
  const [addWatermark, setAddWatermark] = useState(false);
  const [watermarkText, setWatermarkText] = useState("Watermark");
  const [fileName, setFileName] = useState(""); // Default file name
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768); // Change threshold as needed
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Call on mount to set initial state

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);
  // Retrieve images from session storage
  useEffect(() => {
    const savedImages = sessionStorage.getItem("images");
    if (savedImages) {
      setImages(JSON.parse(savedImages));
    }
  }, []);

  // Save images to session storage whenever images change
  useEffect(() => {
    sessionStorage.setItem("images", JSON.stringify(images));
  }, [images]);

  // Handle file drop
  const onDrop = async (acceptedFiles) => {
    const encryptedFiles = await Promise.all(
      acceptedFiles.map(async (file) => {
        const reader = new FileReader();
        return new Promise((resolve) => {
          reader.onloadend = () => {
            const encryptedData = encrypt(reader.result);
            resolve({
              file,
              encryptedData,
              preview: URL.createObjectURL(file),
            });
          };
          reader.readAsDataURL(file);
        });
      })
    );
    setImages((prevImages) => [...prevImages, ...encryptedFiles]);
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: "image/*",
    multiple: true,
  });

  const handleRemoveFile = (index) => {
    setImages((prevImages) => {
      const newImages = prevImages.filter((_, i) => i !== index);
      prevImages[index].preview &&
        URL.revokeObjectURL(prevImages[index].preview);
      return newImages;
    });
  };

  const handleWatermarkChange = () => {
    setAddWatermark(!addWatermark);
  };

  const handleWatermarkTextChange = (e) => {
    setWatermarkText(e.target.value);
  };

  const handleFileNameChange = (e) => {
    setFileName(e.target.value);
  };

  // Disable reordering in drag and drop context
  const onDragEnd = (result) => {
    // Do nothing here to disable reordering
  };

  const generatePDF = async () => {
    if (images.length === 0) {
      alert("Please upload at least one image.");
      return;
    }

    const pdf = new jsPDF();
    for (let i = 0; i < images.length; i++) {
      const img = images[i].file;
      const imgData = await readImageAsDataURL(img);

      if (i > 0) {
        pdf.addPage();
      }

      pdf.addImage(imgData, "PNG", 10, 10, 180, 0);

      if (addWatermark) {
        addWatermarkToPDF(pdf);
      }
    }

    if (fileName) {
      pdf.save(`${fileName}.pdf`);
    } else {
      pdf.save("images.pdf");
    }

    // Clear images from state and session storage
    setImages([]);
    sessionStorage.removeItem("images");
  };

  const readImageAsDataURL = (imageFile) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(imageFile);
    });
  };

  const addWatermarkToPDF = (pdf) => {
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    pdf.setTextColor(150, 150, 150); // Light gray color
    pdf.setFontSize(14);
    pdf.text(watermarkText, pageWidth / 2, pageHeight / 2, {
      align: "center",
      angle: 45,
    });
  };

  useEffect(() => {
    return () => {
      images.forEach((image) => {
        image.preview && URL.revokeObjectURL(image.preview);
      });
    };
  }, [images]);

  return (
    <div className="h-fit min-h-screen w-full bg-[#161616] flex flex-col items-center justify-center p-6">
      <div className="mb-4 w-2/3 h-fit flex justify-center items-center">
        <h1 className="sm:text-9xl text-5xl font-bold tracking-tighter text-center">
          <span className="text-[#E34133] w-full">Convert your</span> file
          easily
        </h1>
      </div>
      <div
        {...getRootProps({
          className:
            "dropzone bg-white p-6 rounded-lg shadow-md w-full max-w-md border-dashed border-2 border-gray-300",
        })}
        className="relative flex flex-col items-center justify-center sm:my-4 my-2 border-dashed border rounded-lg sm:p-8 p-5 overflow-hidden"
      >
        <input {...getInputProps()} />
        <div className="w-20 h-20 overflow-hidden">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={80}
            height={80}
            viewBox="0 0 24 24"
            fill="none"
            stroke="#E34133"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="icon icon-tabler icons-tabler-outline icon-tabler-cloud-download"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M19 18a3.5 3.5 0 0 0 0 -7h-1a5 4.5 0 0 0 -11 -2a4.6 4.4 0 0 0 -2.1 8.4" />
            <path d="M12 13l0 9" />
            <path d="M9 19l3 3l3 -3" />
          </svg>
        </div>
        <p className="mb-5 text-2xl">
          Drag & drop images here, or click to select files
        </p>
      </div>
      <div className="relative sm:flex sm:flex-col sm:items-center sm:justify-center w-full overflow-x-scroll sm:overflow-x-hidden sm my-4 rounded-lg p-8">
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="droppable" isDropDisabled>
            {(provided) => (
              <div
                className="mb-4 flex flex-wrap justify-center gap-10 items-start"
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {images.map((image, index) => (
                  <Draggable
                    key={index}
                    draggableId={index.toString()} // Use index as string to ensure unique ID
                    index={index}
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="relative mb-2 max-w-64 max-h-64 w-fit h-fit overflow-hidden object-contain rounded border border-gray-300 "
                      >
                        <img
                          src={image.preview}
                          alt={`Preview ${index}`}
                          className="w-full rounded object-contain"
                        />
                        <button
                          onClick={() => handleRemoveFile(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
      {images.length > 0 && (
        <input
          type="text"
          value={fileName}
          onChange={handleFileNameChange}
          placeholder="Enter file name"
          className="border-none outline-none placeholder:text-[#262626] text-[#262626] p-2 rounded mb-4 w-fit text-center"
        />
      )}
      {images.length > 0 && (
        <div className="flex items-center me-4">
          <input
            id="red-checkbox"
            type="checkbox"
            checked={addWatermark}
            onChange={handleWatermarkChange}
            value=""
            className="w-fit text-[#262626] aw rounded-lg my-2 border-none outline-none"
          />
          <label
            htmlFor="red-checkbox"
            className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
          >
            Add Watermark
          </label>
        </div>
      )}
      {addWatermark && images.length > 0 && (
        <input
          type="text"
          value={watermarkText}
          onChange={handleWatermarkTextChange}
          placeholder="Enter watermark text"
          className="border-none outline-none p-2 text-[#262626] placeholder:text-[#262626] rounded mb-4 w-fit text-center"
        />
      )}
      {images.length > 0 && (
        <button
          onClick={generatePDF}
          className="bg-[#E34133] text-white py-2 px-4 rounded hover:bg-[#b43428]"
        >
          Generate PDF
        </button>
      )}
    </div>
  );
};

export default App;
