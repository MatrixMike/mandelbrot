use minifb::{Key, Window, WindowOptions};
use palette::{encoding::pixel::Pixel, Gradient, Hsv, LinSrgb};

const WIDTH: usize = 1024;
const HEIGHT: usize = 768;

const X_MIN: f64 = -2.333;
const X_MAX: f64 = 1.0;
const Y_MIN: f64 = -1.25;
const Y_MAX: f64 = 1.25;

const MAX_ITERATIONS: usize = 30;

fn main() {
    let mut buffer: Vec<u32> = vec![0; WIDTH * HEIGHT];

    let mut window = Window::new("mandelbrot", WIDTH, HEIGHT, WindowOptions::default())
        .unwrap_or_else(|e| {
            panic!("{}", e);
        });

    let grad = Gradient::new(vec![
        Hsv::from(LinSrgb::new(0.0, 0.0, 1.0)),
        Hsv::from(LinSrgb::new(1.0, 0.0, 1.0)),
        Hsv::from(LinSrgb::new(0.000_001, 0.0, 0.0)),
    ]);

    let palette: Vec<u32> = grad
        .take(MAX_ITERATIONS)
        .map(|color| {
            let pixel: [u8; 3] = LinSrgb::from(color).into_format().into_raw();
            (u32::from(pixel[0]) << 16) | (u32::from(pixel[1]) << 8) | (u32::from(pixel[2]))
        })
        .collect();

    for p_y in 0..HEIGHT {
        let y_0: f64 = (p_y as f64 / HEIGHT as f64) * (Y_MIN - Y_MAX) + Y_MAX;
        for p_x in 0..WIDTH {
            let x_0: f64 = (p_x as f64 / WIDTH as f64) * (X_MAX - X_MIN) + X_MIN;
            let escape_time = iterate(x_0, y_0);
            buffer[p_y * WIDTH + p_x] = palette[escape_time - 1];
        }
    }

    while window.is_open() && !window.is_key_down(Key::Escape) {
        window.update_with_buffer(&buffer).unwrap();
    }
}

fn iterate(x_0: f64, y_0: f64) -> usize {
    let mut x: f64 = 0.0;
    let mut y: f64 = 0.0;
    let mut iteration: usize = 0;
    while x * x + y * y <= 4.0 && iteration < MAX_ITERATIONS {
        let x_new = x * x - y * y + x_0;
        let y_new = 2.0 * x * y + y_0;
        x = x_new;
        y = y_new;
        iteration += 1;
    }
    iteration
}
