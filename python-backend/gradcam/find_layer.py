"""
Finds the exact layer index and name of the last convolutional layer
in your EfficientNetB3 model - specific to your installed TF/Keras version.
"""

from tensorflow.keras.applications import EfficientNetB3

model = EfficientNetB3(include_top=False, weights=None, input_shape=(300, 300, 3))

print(f"Total layers: {len(model.layers)}\n")

# Print the last 10 layers with their index numbers
print("Last 10 layers (index, name, output_shape):")
for i, layer in enumerate(model.layers[-10:], start=len(model.layers) - 10):
    print(f"  [{i}] {layer.name}  ->  {layer.output_shape}")

# Explicitly confirm top_conv exists and its exact index
for i, layer in enumerate(model.layers):
    if layer.name == "top_conv":
        print(f"\n'top_conv' found at exact index: [{i}]")
        break
else:
    print("\n'top_conv' not found by that exact name in this version - check the list above for the actual last conv layer name.")