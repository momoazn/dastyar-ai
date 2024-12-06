import React from "react";
import { ImagePlus, Download, Sliders } from "lucide-react";
import { useStore } from "../store/useStore";
import { motion } from "framer-motion";

export const ImageSection: React.FC = () => {
  const { imageParams, setImageParams, generatedImages } = useStore();

  const handleGenerate = () => {
    // TODO: Implement image generation
  };

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="space-y-4">
            <textarea
              value={imageParams.prompt}
              onChange={(e) => setImageParams({ prompt: e.target.value })}
              className="w-full border rounded-md p-4 h-32 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="توضیحات تصویر مورد نظر خود را وارد کنید..."
              dir="rtl"
            />
          </div>
          <div className="bg-gray-50 rounded-md p-4 space-y-4">
            <div className="flex items-center gap-2 text-gray-700 mb-3">
              <Sliders className="w-5 h-5" />
              <span className="font-medium">تنظیمات</span>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  اندازه تصویر
                </label>
                <select
                  value={imageParams.size}
                  onChange={(e) =>
                    setImageParams({
                      size: e.target.value as typeof imageParams.size,
                    })
                  }
                  className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="512x512">512x512</option>
                  <option value="768x768">768x768</option>
                  <option value="1024x1024">1024x1024</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  تعداد مراحل
                </label>
                <input
                  type="range"
                  value={imageParams.steps}
                  onChange={(e) =>
                    setImageParams({ steps: parseInt(e.target.value) })
                  }
                  className="w-full"
                  min={1}
                  max={50}
                />
                <div className="text-sm text-gray-500 text-center">
                  {imageParams.steps}
                </div>
              </div>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.98 }}
            className="w-full bg-blue-500 text-white rounded-md py-3 px-4 flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors"
            onClick={handleGenerate}
          >
            <ImagePlus className="w-5 h-5" />
            <span>ایجاد تصویر</span>
          </motion.button>
        </div>
        <div className="bg-gray-50 rounded-md p-4">
          <h3 className="text-lg font-medium mb-4">تصاویر تولید شده</h3>
          <div className="grid grid-cols-2 gap-4">
            {generatedImages.map((image, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative group rounded-md overflow-hidden"
              >
                <img
                  src={image}
                  alt={`Generated ${index + 1}`}
                  className="w-full h-48 object-cover"
                />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  className="absolute bottom-2 right-2 bg-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Download className="w-5 h-5" />
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
