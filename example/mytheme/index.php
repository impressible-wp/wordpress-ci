<?php
/**
 * The main template file
 *
 * This is the most generic template file in a WordPress theme
 * and one of the two required files for a theme (the other being style.css).
 * It is used to display a page when nothing more specific matches a query.
 */

get_header(); ?>


<div class="before-content">
    Hello. This is my theme!
</div>

<div id="primary" class="content-area">
    <main id="main" class="site-main">

        <?php if (have_posts()) : ?>

            <?php while (have_posts()) : the_post(); ?>

                <article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
                    <header class="entry-header">
                        <h1 class="entry-title">
                            <a href="<?php the_permalink(); ?>" rel="bookmark">
                                <?php the_title(); ?>
                            </a>
                        </h1>
                        <div class="entry-meta">
                            <span class="posted-on">
                                <?php echo get_the_date(); ?>
                            </span>
                            <span class="byline">
                                by <?php the_author(); ?>
                            </span>
                        </div>
                    </header>

                    <div class="entry-content">
                        <?php the_excerpt(); ?>
                        <a href="<?php the_permalink(); ?>" class="read-more">
                            Read More
                        </a>
                    </div>
                </article>

            <?php endwhile; ?>

            <div class="pagination">
                <?php
                the_posts_pagination(array(
                    'mid_size' => 2,
                    'prev_text' => __('Previous', 'textdomain'),
                    'next_text' => __('Next', 'textdomain'),
                ));
                ?>
            </div>

        <?php else : ?>

            <section class="no-results not-found">
                <header class="page-header">
                    <h1 class="page-title"><?php esc_html_e('Nothing here', 'textdomain'); ?></h1>
                </header>

                <div class="page-content">
                    <p><?php esc_html_e('It looks like nothing was found at this location. Maybe try a search?', 'textdomain'); ?></p>
                    <?php get_search_form(); ?>
                </div>
            </section>

        <?php endif; ?>

    </main>
</div>

<?php
get_sidebar();
get_footer();
