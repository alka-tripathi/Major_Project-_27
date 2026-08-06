import tensorflow as tf

# Load the .h5 model
# model = tf.keras.models.load_model("models/brain_tumor_efficientnetb3.h5")
model = tf.keras.models.load_model("models/brain_tumor_efficientnetb3.keras")
# Save it as .keras
model.save("models/brain_tumor_efficientnetb3.keras")

print("Conversion completed successfully!")