"""
===========================================================
Attention U-Net for Brain Tumor Segmentation
===========================================================

Author : Anchal Dwivedi
Project : Brain Tumor AI

This file contains the complete Attention U-Net architecture.
"""

import tensorflow as tf

from tensorflow.keras.layers import (
    Input,
    Conv2D,
    MaxPooling2D,
    Conv2DTranspose,
    BatchNormalization,
    Activation,
    concatenate,
    Multiply,
    Add
)

from tensorflow.keras.models import Model


# ==========================================================
# Convolution Block
# ==========================================================

def conv_block(inputs, filters):

    x = Conv2D(
        filters,
        3,
        padding="same"
    )(inputs)

    x = BatchNormalization()(x)
    x = Activation("relu")(x)

    x = Conv2D(
        filters,
        3,
        padding="same"
    )(x)

    x = BatchNormalization()(x)
    x = Activation("relu")(x)

    return x


# ==========================================================
# Attention Gate
# ==========================================================

def attention_gate(skip_connection, gating_signal, filters):

    theta_x = Conv2D(
        filters,
        1,
        padding="same"
    )(skip_connection)

    phi_g = Conv2D(
        filters,
        1,
        padding="same"
    )(gating_signal)

    add = Add()([
        theta_x,
        phi_g
    ])

    add = Activation("relu")(add)

    psi = Conv2D(
        1,
        1,
        padding="same"
    )(add)

    psi = Activation("sigmoid")(psi)

    output = Multiply()([
        skip_connection,
        psi
    ])

    return output


# ==========================================================
# Decoder Block
# ==========================================================

def decoder_block(inputs, skip_features, filters):

    x = Conv2DTranspose(
        filters,
        2,
        strides=2,
        padding="same"
    )(inputs)

    skip = attention_gate(
        skip_features,
        x,
        filters
    )

    x = concatenate([
        x,
        skip
    ])

    x = conv_block(
        x,
        filters
    )

    return x

# ==========================================================
# Build Attention U-Net
# ==========================================================

def build_attention_unet(input_shape=(256, 256, 3)):

    # ---------------- Encoder ----------------

    s1 = conv_block(Input(input_shape), 64)
    p1 = MaxPooling2D((2, 2))(s1)

    s2 = conv_block(p1, 128)
    p2 = MaxPooling2D((2, 2))(s2)

    s3 = conv_block(p2, 256)
    p3 = MaxPooling2D((2, 2))(s3)

    s4 = conv_block(p3, 512)
    p4 = MaxPooling2D((2, 2))(s4)

    # ---------------- Bottleneck ----------------

    b1 = conv_block(p4, 1024)

    # ---------------- Decoder ----------------

    d1 = decoder_block(b1, s4, 512)

    d2 = decoder_block(d1, s3, 256)

    d3 = decoder_block(d2, s2, 128)

    d4 = decoder_block(d3, s1, 64)

    # ---------------- Output Layer ----------------

    outputs = Conv2D(
        filters=1,
        kernel_size=1,
        padding="same",
        activation="sigmoid"
    )(d4)

    model = Model(
        inputs=s1._keras_history[0].input,
        outputs=outputs,
        name="Attention_UNet"
    )

    return model


# ==========================================================
# Run this file directly (Testing)
# ==========================================================

if __name__ == "__main__":

    model = build_attention_unet()

    model.summary()